const MAX_VISIBLE_RECORDS = 5;

const DEFINITIONS = Object.freeze({
  'customers.list': Object.freeze({
    label: 'Clientes',
    empty: 'No hay clientes registrados.',
    primary: ['displayName', 'name', 'legalName', 'tradeName', 'businessName'],
    details: ['status', 'customerType', 'city']
  }),
  'suppliers.list': Object.freeze({
    label: 'Proveedores',
    empty: 'No hay proveedores registrados.',
    primary: ['displayName', 'name', 'legalName', 'tradeName', 'businessName'],
    details: ['status', 'supplierType', 'city']
  }),
  'leads.list': Object.freeze({
    label: 'Leads',
    empty: 'No hay leads registrados.',
    primary: ['title', 'displayName', 'name', 'customerName', 'contactName'],
    details: ['status', 'priority', 'platform']
  }),
  'opportunities.list': Object.freeze({
    label: 'Oportunidades',
    empty: 'No hay oportunidades registradas.',
    primary: ['title', 'name', 'customerName', 'contactName'],
    details: ['stage', 'status', 'platform']
  }),
  'quotes.list': Object.freeze({
    label: 'Cotizaciones',
    empty: 'No hay cotizaciones registradas.',
    primary: ['quoteNumber', 'number', 'title', 'customerName'],
    details: ['status', 'total', 'totalAmount', 'currency']
  }),
  'orders.list': Object.freeze({
    label: 'Órdenes',
    empty: 'No hay órdenes registradas.',
    primary: ['orderNumber', 'number', 'title', 'customerName'],
    details: [
      'status',
      'productionStatus',
      'paymentStatus',
      'fulfillmentStatus'
    ]
  })
});

const STATUS_TRANSLATIONS = Object.freeze({
  accepted: 'aceptada',
  active: 'activo',
  cancelled: 'cancelada',
  completed: 'completada',
  converted: 'convertido',
  draft: 'borrador',
  fulfilled: 'completada',
  in_progress: 'en proceso',
  lost: 'perdida',
  new: 'nuevo',
  paid: 'pagada',
  partial: 'parcial',
  pending: 'pendiente',
  sent: 'enviada',
  unpaid: 'pendiente de pago',
  won: 'ganada'
});

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function firstValue(source, fields) {
  for (const field of fields) {
    const value = source?.[field];
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return value;
    }
  }
  return null;
}

function extractRecords(value, depth = 0) {
  if (Array.isArray(value)) return value;
  if (!isObject(value) || depth > 4) return [];

  const keys = [
    'data',
    'items',
    'results',
    'records',
    'parties',
    'leads',
    'opportunities',
    'quotes',
    'orders'
  ];

  for (const key of keys) {
    if (value[key] !== undefined) {
      const records = extractRecords(value[key], depth + 1);
      if (records.length > 0 || Array.isArray(value[key])) return records;
    }
  }

  return [];
}

function extractTotal(value, fallback, depth = 0) {
  if (!isObject(value) || depth > 4) return fallback;

  const direct = firstValue(value, ['total', 'totalCount', 'count']);
  if (direct !== null && Number.isFinite(Number(direct))) {
    return Math.max(0, Number(direct));
  }

  for (const key of ['pagination', 'meta', 'data']) {
    if (isObject(value[key])) {
      const nested = extractTotal(value[key], null, depth + 1);
      if (nested !== null) return nested;
    }
  }

  return fallback;
}

function cleanText(value) {
  const normalized = String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim();
  return normalized || null;
}

function humanize(value) {
  const normalized = cleanText(value);
  if (!normalized) return null;

  const statusKey = normalized.toLowerCase().replace(/[\s-]+/g, '_');
  if (STATUS_TRANSLATIONS[statusKey]) {
    return STATUS_TRANSLATIONS[statusKey];
  }

  return normalized.replace(/[_-]+/g, ' ').toLowerCase();
}

function formatAmount(value, currency) {
  if (value === null || value === undefined || String(value).trim() === '') {
    return null;
  }

  const amount = Number(value);
  if (!Number.isFinite(amount)) return null;

  const normalizedCurrency = cleanText(currency)?.toUpperCase() || 'USD';
  return `${normalizedCurrency} ${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

function formatRecord(record, definition, index) {
  if (!isObject(record)) return `Registro ${index + 1}`;

  const primary = cleanText(firstValue(record, definition.primary)) ||
    `Registro ${index + 1}`;
  const details = [];
  const amount = firstValue(record, ['total', 'totalAmount', 'amount']);
  const currency = firstValue(record, ['currency', 'currencyCode']);

  for (const field of definition.details) {
    if (field === 'total' || field === 'totalAmount' || field === 'currency') {
      continue;
    }

    const detail = humanize(record[field]);
    if (detail && !details.includes(detail)) details.push(detail);
  }

  const formattedAmount = formatAmount(amount, currency);
  if (formattedAmount) details.push(formattedAmount);

  return details.length > 0
    ? `${primary} — ${details.slice(0, 3).join(' · ')}`
    : primary;
}

function resolveConnectResult(toolResults) {
  if (!Array.isArray(toolResults)) return null;

  for (const tool of toolResults) {
    if (tool?.toolName !== 'connect' || tool?.status !== 'SUCCESS') continue;

    const operation = cleanText(tool?.data?.operation);
    if (!operation || !DEFINITIONS[operation]) continue;

    return {
      operation,
      payload: tool?.data?.result
    };
  }

  return null;
}

export function buildControlledConnectReadResponse(toolResults) {
  const connectResult = resolveConnectResult(toolResults);
  if (!connectResult) return null;

  const definition = DEFINITIONS[connectResult.operation];
  const records = extractRecords(connectResult.payload);
  const total = extractTotal(connectResult.payload, records.length);

  if (records.length === 0) return definition.empty;

  const visible = records.slice(0, MAX_VISIBLE_RECORDS);
  const lines = visible.map(
    (record, index) => `${index + 1}. ${formatRecord(record, definition, index)}`
  );
  const summary = `${definition.label}: ${total}.`;

  if (total > visible.length) {
    lines.push(`Mostrando ${visible.length} de ${total}.`);
  }

  return [summary, ...lines].join('\n');
}

export {
  DEFINITIONS as CONTROLLED_CONNECT_RESPONSE_DEFINITIONS,
  MAX_VISIBLE_RECORDS
};

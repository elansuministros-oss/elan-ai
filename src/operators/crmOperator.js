import { BaseOperator } from './baseOperator.js';

function normalize(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function splitSupplierBlocks(message) {
  const text = String(message || '').replace(/\r\n/g, '\n');
  const matches = [...text.matchAll(/(?:^|\n)\s*(?:\*\*)?proveedor\s+\d+(?:\*\*)?\s*\n/gi)];

  if (matches.length === 0) {
    return /proveedor/i.test(text) ? [text] : [];
  }

  return matches.map((match, index) => {
    const start = match.index + match[0].length;
    const end = matches[index + 1]?.index ?? text.length;
    return text.slice(start, end).trim();
  });
}

function readField(block, labels) {
  const escaped = labels.map((label) => label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const pattern = new RegExp(
    `(?:^|\\n)\\s*(?:[-•*]\\s*)?(?:${escaped.join('|')})\\s*:\\s*([^\\n]+)`,
    'i'
  );
  return block.match(pattern)?.[1]?.trim() ?? null;
}

function parseSupplier(block) {
  const supplier = {
    name: readField(block, ['Nombre comercial', 'Nombre', 'Proveedor']),
    type: readField(block, ['Tipo']) || 'Proveedor',
    city: readField(block, ['Ciudad']),
    country: readField(block, ['País', 'Pais']),
    phone: readField(block, ['Teléfono', 'Telefono']),
    email: readField(block, ['Correo', 'Email']),
    productsAndServices: readField(block, ['Productos y servicios', 'Servicios', 'Productos']),
    status: readField(block, ['Estado']) || 'Activo'
  };

  supplier.normalizedName = normalize(supplier.name).toLowerCase();
  supplier.normalizedPhone = String(supplier.phone || '').replace(/\D/g, '');
  return supplier;
}

function isComplete(supplier) {
  return Boolean(supplier.name && supplier.phone && supplier.productsAndServices);
}

export function extractSuppliers(message) {
  return splitSupplierBlocks(message)
    .map(parseSupplier)
    .filter(isComplete);
}

export class CrmOperator extends BaseOperator {
  constructor() {
    super('crm');
  }

  async execute({ context } = {}) {
    const suppliers = extractSuppliers(context?.message);

    if (suppliers.length === 0) {
      return Object.freeze({
        operator: this.name,
        requestId: context?.requestId ?? null,
        response: 'No encontré proveedores completos. Incluí al menos nombre, teléfono y productos o servicios.',
        suppliers: Object.freeze([]),
        actions: Object.freeze([]),
        status: 'NEEDS_DATA'
      });
    }

    return Object.freeze({
      operator: this.name,
      requestId: context?.requestId ?? null,
      response: `Procesé ${suppliers.length} proveedor${suppliers.length === 1 ? '' : 'es'} sin pedir nuevamente el nombre.`,
      suppliers: Object.freeze(suppliers.map((supplier) => Object.freeze(supplier))),
      actions: Object.freeze([]),
      status: 'COMPLETED'
    });
  }
}

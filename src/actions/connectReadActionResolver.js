const READ_COMMAND_PATTERN =
  /\b(lista|listar|muestra|mostrar|mostra|mostrame|revisa|revisar|consulta|consultar|busca|buscar|ver|cuales|cuantos|cuantas|mis|estado)\b/;

const MUTATION_PATTERN =
  /\b(crea|crear|agrega|agregar|registra|registrar|nuevo|nueva|actualiza|actualizar|cambia|cambiar|elimina|eliminar|acepta|aceptar|convierte|convertir)\b/;

const DEFINITIONS = Object.freeze([
  Object.freeze({
    operation: 'opportunities.list',
    permission: 'connect:opportunities:read',
    subject: /\b(oportunidad|oportunidades)\b/,
    platformFilter: true
  }),
  Object.freeze({
    operation: 'quotes.list',
    permission: 'connect:quotes:read',
    subject: /\b(cotizacion|cotizaciones|presupuesto|presupuestos)\b/,
    platformFilter: true
  }),
  Object.freeze({
    operation: 'orders.list',
    permission: 'connect:orders:read',
    subject: /\b(orden|ordenes|pedido|pedidos)\b/,
    platformFilter: true
  }),
  Object.freeze({
    operation: 'customers.list',
    permission: 'connect:customers:read',
    subject: /\b(cliente|clientes)\b/
  }),
  Object.freeze({
    operation: 'suppliers.list',
    permission: 'connect:suppliers:read',
    subject: /\b(proveedor|proveedores)\b/
  }),
  Object.freeze({
    operation: 'leads.list',
    permission: 'connect:leads:read',
    subject: /\b(lead|leads|prospecto|prospectos)\b/,
    platformFilter: true
  })
]);

function normalize(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

export function resolveControlledConnectReadAction(context = {}) {
  const metadata =
    context.metadata &&
    typeof context.metadata === 'object' &&
    !Array.isArray(context.metadata)
      ? context.metadata
      : {};
  const permissions = Array.isArray(metadata.permissions)
    ? metadata.permissions.map(value => String(value || '').trim())
    : [];
  const message = normalize(context.message);

  if (
    metadata.mode !== 'active' ||
    metadata.ownerMode !== true ||
    !READ_COMMAND_PATTERN.test(message) ||
    MUTATION_PATTERN.test(message)
  ) {
    return null;
  }

  const definition = DEFINITIONS.find(item => item.subject.test(message));
  if (!definition || !permissions.includes(definition.permission)) {
    return null;
  }

  const input = {};
  const platform = String(metadata.platform || '').trim();
  if (definition.platformFilter && platform) {
    input.platform = platform;
  }

  return Object.freeze({
    type: 'CONNECT_READ',
    toolName: 'connect',
    input: Object.freeze({
      operation: definition.operation,
      input: Object.freeze(input),
      permissions: Object.freeze([...permissions]),
      mode: 'active'
    })
  });
}

export {
  DEFINITIONS as CONNECT_READ_DEFINITIONS
};

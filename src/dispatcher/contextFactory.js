import { randomUUID } from 'node:crypto';

const SUPPORTED_CHANNELS = new Set([
  'api',
  'web',
  'whatsapp',
  'telegram',
  'internal'
]);

function requireText(value, fieldName) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new TypeError(`${fieldName} debe ser un texto no vacío`);
  }

  return value.trim();
}

export function createDispatchContext(input = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new TypeError('La entrada del Dispatcher debe ser un objeto');
  }

  const channel = requireText(input.channel, 'channel').toLowerCase();

  if (!SUPPORTED_CHANNELS.has(channel)) {
    throw new RangeError(`Canal no soportado: ${channel}`);
  }

  const message = requireText(input.message, 'message');
  const externalUserId = input.externalUserId == null
    ? null
    : requireText(String(input.externalUserId), 'externalUserId');

  const metadata = input.metadata &&
    typeof input.metadata === 'object' &&
    !Array.isArray(input.metadata)
    ? { ...input.metadata }
    : {};

  return Object.freeze({
    requestId: randomUUID(),
    channel,
    externalUserId,
    message,
    metadata: Object.freeze(metadata),
    receivedAt: new Date().toISOString(),
    status: 'RECEIVED'
  });
}

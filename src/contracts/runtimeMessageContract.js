export const RUNTIME_CONTRACT_VERSION = 'ELAN-AI-INT-001';

const ALLOWED_CHANNELS = new Set([
  'api',
  'internal',
  'web',
  'whatsapp'
]);

const ALLOWED_MODES = new Set([
  'active',
  'shadow'
]);

function requireObject(value, fieldName) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`${fieldName} debe ser un objeto`);
  }

  return value;
}

function requireText(value, fieldName) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new TypeError(`${fieldName} debe ser un texto no vacío`);
  }

  return value.trim();
}

function optionalText(value) {
  if (value == null) return null;
  const normalized = String(value).trim();
  return normalized || null;
}

function normalizeHistory(value) {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item) => item && typeof item === 'object')
    .map((item) => ({
      role: optionalText(item.role),
      content: optionalText(item.content)
    }))
    .filter((item) => (
      ['assistant', 'user'].includes(item.role) &&
      item.content
    ))
    .slice(-20);
}

export function parseRuntimeMessageRequest(input) {
  const request = requireObject(input, 'request');
  const version = requireText(request.version, 'version');

  if (version !== RUNTIME_CONTRACT_VERSION) {
    throw new RangeError(`Versión de contrato no soportada: ${version}`);
  }

  const channel = requireText(request.channel, 'channel').toLowerCase();
  if (!ALLOWED_CHANNELS.has(channel)) {
    throw new RangeError(`Canal no soportado: ${channel}`);
  }

  const mode = requireText(request.mode || 'shadow', 'mode').toLowerCase();
  if (!ALLOWED_MODES.has(mode)) {
    throw new RangeError(`Modo no soportado: ${mode}`);
  }

  const identity = request.identity == null
    ? {}
    : requireObject(request.identity, 'identity');
  const context = request.context == null
    ? {}
    : requireObject(request.context, 'context');
  const metadata = context.metadata &&
    typeof context.metadata === 'object' &&
    !Array.isArray(context.metadata)
    ? { ...context.metadata }
    : {};

  return Object.freeze({
    version,
    requestId: requireText(request.requestId, 'requestId'),
    mode,
    channel,
    message: requireText(request.message, 'message'),
    identity: Object.freeze({
      externalUserId:
        optionalText(identity.externalUserId) ||
        optionalText(identity.phone) ||
        'anonymous',
      phone: optionalText(identity.phone),
      ownerMode: identity.ownerMode === true
    }),
    context: Object.freeze({
      platform: optionalText(context.platform),
      conversationHistory: Object.freeze(
        normalizeHistory(context.conversationHistory)
      ),
      permissions: Object.freeze(
        Array.isArray(context.permissions)
          ? context.permissions.map(optionalText).filter(Boolean)
          : []
      ),
      metadata: Object.freeze(metadata)
    })
  });
}

export function toRuntimeInput(request) {
  return Object.freeze({
    externalUserId: request.identity.externalUserId,
    phone: request.identity.phone,
    message: request.message,
    metadata: Object.freeze({
      ...request.context.metadata,
      correlationRequestId: request.requestId,
      contractVersion: request.version,
      mode: request.mode,
      ownerMode: request.identity.ownerMode,
      platform: request.context.platform,
      permissions: request.context.permissions,
      conversationHistory: request.context.conversationHistory
    })
  });
}

export function createRuntimeMessageResponse(request, result) {
  const responseText = optionalText(result?.response?.message);

  return Object.freeze({
    version: RUNTIME_CONTRACT_VERSION,
    requestId: request.requestId,
    runtimeRequestId: optionalText(result?.requestId),
    mode: request.mode,
    status: optionalText(result?.status) || 'UNKNOWN',
    decision: Object.freeze({
      intent: optionalText(result?.plan?.intent),
      operator: optionalText(result?.plan?.selectedOperator),
      allowed: result?.business?.allowed === true,
      cancelled: result?.cancelled === true
    }),
    output: Object.freeze({
      text: responseText,
      recipient: optionalText(result?.response?.recipient),
      deliverable: request.mode === 'active' && Boolean(responseText)
    }),
    audit: Object.freeze({
      identityId: optionalText(result?.identity?.identityId),
      sessionId: optionalText(result?.sessionId),
      toolsExecuted:
        request.mode === 'active' &&
        Array.isArray(result?.tools) &&
        result.tools.length > 0
    })
  });
}

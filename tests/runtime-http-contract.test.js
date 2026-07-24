import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import test from 'node:test';
import {
  RUNTIME_CONTRACT_VERSION,
  parseRuntimeMessageRequest
} from '../src/contracts/index.js';
import { createRuntimeHttpHandler } from '../src/http/index.js';

async function withServer(handler, callback) {
  const server = createServer(handler);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();

  try {
    return await callback(`http://127.0.0.1:${address.port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
  }
}

function createRequest(overrides = {}) {
  return {
    version: RUNTIME_CONTRACT_VERSION,
    requestId: 'orch-request-001',
    mode: 'shadow',
    channel: 'whatsapp',
    message: 'Necesito una cotización',
    identity: {
      externalUserId: '50588888888',
      phone: '50588888888',
      ownerMode: false
    },
    context: {
      platform: 'elanvisual',
      permissions: [],
      conversationHistory: []
    },
    ...overrides
  };
}

test('contrato normaliza una solicitud válida', () => {
  const request = parseRuntimeMessageRequest(createRequest());

  assert.equal(request.version, RUNTIME_CONTRACT_VERSION);
  assert.equal(request.mode, 'shadow');
  assert.equal(request.identity.externalUserId, '50588888888');
  assert.equal(request.context.platform, 'elanvisual');
});

test('contrato rechaza versiones incompatibles', () => {
  assert.throws(
    () => parseRuntimeMessageRequest(
      createRequest({ version: 'ELAN-AI-INT-999' })
    ),
    /Versión de contrato no soportada/
  );
});

test('servicio requiere token interno', async () => {
  const handler = createRuntimeHttpHandler({
    authToken: 'secret',
    runtime: {
      async process() {
        throw new Error('No debe ejecutarse');
      }
    }
  });

  await withServer(handler, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/v1/runtime/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(createRequest())
    });

    assert.equal(response.status, 401);
  });
});

test('shadow invoca runtime sin ejecutar herramientas', async () => {
  const calls = [];
  const handler = createRuntimeHttpHandler({
    authToken: 'secret',
    runtime: {
      async process(channel, input, options) {
        calls.push({ channel, input, options });
        return {
          requestId: 'runtime-request-001',
          status: 'COMPLETED',
          identity: { identityId: 'identity-001' },
          sessionId: 'identity-001',
          plan: {
            intent: 'quote',
            selectedOperator: 'sales'
          },
          business: { allowed: true },
          tools: [],
          response: {
            recipient: '50588888888',
            message: 'Respuesta de prueba'
          }
        };
      }
    }
  });

  await withServer(handler, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/v1/runtime/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-ELAN-AI-Token': 'secret'
      },
      body: JSON.stringify(createRequest())
    });
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.requestId, 'orch-request-001');
    assert.equal(body.runtimeRequestId, 'runtime-request-001');
    assert.equal(body.decision.intent, 'quote');
    assert.equal(body.output.deliverable, false);
    assert.equal(body.audit.toolsExecuted, false);
    assert.equal(calls[0].options.executeTools, false);
    assert.equal(
      calls[0].input.metadata.correlationRequestId,
      'orch-request-001'
    );
  });
});

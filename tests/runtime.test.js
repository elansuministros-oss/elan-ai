import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createDefaultElanAIRuntime
} from '../src/core/index.js';

test('Runtime ejecuta flujo completo desde WhatsApp', async () => {
  const runtime = createDefaultElanAIRuntime();

  const result = await runtime.process('whatsapp', {
    from: '50588888888',
    body: 'Necesito una cotizacion para un rotulo'
  });

  assert.equal(result.status, 'COMPLETED');
  assert.equal(result.context.channel, 'whatsapp');
  assert.equal(result.plan.intent, 'quote');
  assert.equal(result.plan.selectedOperator, 'sales');
  assert.equal(result.business.allowed, true);
  assert.equal(result.operator.operator, 'sales');
  assert.equal(result.response.channel, 'whatsapp');
  assert.equal(result.response.recipient, '50588888888');
  assert.equal(result.memory.messages.length, 2);
  assert.equal(result.sessionId, result.identity.identityId);
});

test('Runtime conserva memoria por identidad', async () => {
  const runtime = createDefaultElanAIRuntime();

  const first = await runtime.process('whatsapp', {
    from: '50577777777',
    body: 'Hola'
  });

  const second = await runtime.process('whatsapp', {
    from: '50577777777',
    body: 'Necesito precio'
  });

  assert.equal(second.sessionId, first.identity.identityId);
  assert.equal(second.identity.identityId, first.identity.identityId);
  assert.equal(second.memory.messages.length, 4);
  assert.match(second.memory.summary, /Necesito precio/);
});

test('Runtime expone resultado de operador antes de Business Engine', async () => {
  const runtime = createDefaultElanAIRuntime();

  const result = await runtime.process('internal', {
    externalUserId: 'system',
    message: 'Hola'
  });

  assert.equal(result.operator.status, 'COMPLETED');
  assert.equal(result.business.status, 'APPROVED');
  assert.equal(Array.isArray(result.tools), true);
});

test('Runtime cancela flujo antes de razonamiento y operadores', async () => {
  const runtime = createDefaultElanAIRuntime();

  await runtime.process('whatsapp', {
    from: '50566666666',
    body: 'Quiero agregar un cliente'
  });

  const result = await runtime.process('whatsapp', {
    from: '50566666666',
    body: 'Cancelar esta conversación'
  });

  assert.equal(result.status, 'COMPLETED');
  assert.equal(result.cancelled, true);
  assert.equal(result.plan.intent, 'cancel');
  assert.equal(result.plan.classificationSource, 'PRIORITY_COMMAND');
  assert.equal(result.operator, null);
  assert.equal(result.reasoning, null);
  assert.equal(result.tools.length, 0);
  assert.equal(result.state.data.phase, 'CANCELLED');
  assert.equal(result.state.data.activeIntent, null);
  assert.equal(result.state.data.activeOperator, null);
  assert.equal(result.state.data.pendingWorkflow, null);
  assert.deepEqual(result.state.data.pendingFields, []);
  assert.equal(result.state.data.activeForm, null);
  assert.match(result.response.message, /Cancelé el proceso activo/);
});

test('Runtime reconoce cancelacion explicita de proveedor', async () => {
  const runtime = createDefaultElanAIRuntime();

  const result = await runtime.process('whatsapp', {
    from: '50555555555',
    body: 'No voy a agregar ningún proveedor'
  });

  assert.equal(result.cancelled, true);
  assert.equal(result.plan.intent, 'cancel');
  assert.equal(result.state.data.phase, 'CANCELLED');
});

test('Runtime controlado ejecuta una consulta CONNECT del propietario', async () => {
  const calls = [];
  const runtime = createDefaultElanAIRuntime({
    orchestratorClient: {
      async getHealth() {
        return { status: 'READY' };
      },
      async executeConnectTool(input) {
        calls.push(input);
        return {
          success: true,
          result: {
            data: [{ id: 'quote-001' }]
          }
        };
      }
    }
  });

  const result = await runtime.process('whatsapp', {
    from: '50588388940',
    body: 'Revisá mis cotizaciones',
    metadata: {
      mode: 'active',
      ownerMode: true,
      platform: 'elanvisual',
      permissions: ['connect:quotes:read']
    }
  }, {
    executeTools: true
  });

  assert.equal(calls.length, 1);
  assert.equal(calls[0].operation, 'quotes.list');
  assert.deepEqual(calls[0].input, { platform: 'elanvisual' });
  assert.equal(result.tools.length, 1);
  assert.equal(result.tools[0].toolName, 'connect');
});

test('Runtime no ejecuta CONNECT para una identidad cliente', async () => {
  let invoked = false;
  const runtime = createDefaultElanAIRuntime({
    orchestratorClient: {
      async getHealth() {
        return { status: 'READY' };
      },
      async executeConnectTool() {
        invoked = true;
      }
    }
  });

  const result = await runtime.process('whatsapp', {
    from: '50588888888',
    body: 'Revisá mis cotizaciones',
    metadata: {
      mode: 'active',
      ownerMode: false,
      permissions: ['connect:quotes:read']
    }
  }, {
    executeTools: true
  });

  assert.equal(invoked, false);
  assert.equal(result.tools.length, 0);
});

test('Runtime convierte una lectura CONNECT en respuesta controlada', async () => {
  const runtime = createDefaultElanAIRuntime({
    orchestratorClient: {
      async getHealth() {
        return { status: 'READY' };
      },
      async executeConnectTool() {
        return {
          success: true,
          result: {
            data: [{
              id: 'internal-id',
              orderNumber: 'ORD-2026-004',
              status: 'in_progress',
              productionStatus: 'pending'
            }]
          }
        };
      }
    }
  });

  const result = await runtime.process('whatsapp', {
    from: '50588388940',
    body: 'Mostrame las órdenes',
    metadata: {
      mode: 'active',
      ownerMode: true,
      permissions: ['connect:orders:read']
    }
  }, {
    executeTools: true
  });

  assert.equal(
    result.response.message,
    [
      'Órdenes: 1.',
      '1. ORD-2026-004 — en proceso · pendiente'
    ].join('\n')
  );
  assert.equal(result.response.message.includes('internal-id'), false);
});

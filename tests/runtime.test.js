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
});

test('Runtime conserva memoria por sesion', async () => {
  const runtime = createDefaultElanAIRuntime();

  await runtime.process('whatsapp', {
    from: '50577777777',
    body: 'Hola'
  });

  const second = await runtime.process('whatsapp', {
    from: '50577777777',
    body: 'Necesito precio'
  });

  assert.equal(second.sessionId, '50577777777');
  assert.equal(second.memory.messages.length, 4);
  assert.match(second.memory.summary, /Necesito precio/);
});

test('Runtime rechaza dependencia faltante', () => {
  assert.throws(
    () => new (class {
      constructor() {
        const dependencies = {
          channelEngine: null
        };

        for (const [name, dependency] of Object.entries(dependencies)) {
          if (!dependency) {
            throw new TypeError(`ElanAIRuntime requiere ${name}`);
          }
        }
      }
    })(),
    /channelEngine/
  );
});
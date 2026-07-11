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
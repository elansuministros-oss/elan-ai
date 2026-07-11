import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createDefaultElanAIRuntime
} from '../src/core/index.js';

test('Runtime integra State por identidad canonica', async () => {
  const runtime = createDefaultElanAIRuntime();

  const result = await runtime.process('whatsapp', {
    from: '50588888888',
    body: 'Necesito una cotizacion'
  });

  assert.equal(result.status, 'COMPLETED');
  assert.equal(result.stateKey, `identity:${result.identity.identityId}`);
  assert.equal(result.state.data.phase, 'COMPLETED');
  assert.equal(result.state.data.activeIntent, 'quote');
  assert.equal(result.state.data.activeOperator, 'sales');
  assert.equal(result.state.data.lastRequestId, result.requestId);
});

test('Runtime conserva y versiona State entre mensajes', async () => {
  const runtime = createDefaultElanAIRuntime();

  const first = await runtime.process('whatsapp', {
    from: '50577777777',
    body: 'Hola'
  });

  const second = await runtime.process('whatsapp', {
    from: '50577777777',
    body: 'Necesito precio'
  });

  assert.equal(first.stateKey, second.stateKey);
  assert.equal(second.state.data.phase, 'COMPLETED');
  assert.equal(second.state.data.activeIntent, 'quote');
  assert.equal(second.state.data.activeOperator, 'sales');
  assert.ok(second.state.version > first.state.version);
});

test('Runtime separa State cuando no existe coincidencia de identidad', async () => {
  const runtime = createDefaultElanAIRuntime();

  const whatsapp = await runtime.process('whatsapp', {
    from: 'shared-user',
    body: 'Hola'
  });

  const internal = await runtime.process('internal', {
    externalUserId: 'shared-user',
    message: 'Hola'
  });

  assert.match(whatsapp.stateKey, /^identity:/);
  assert.match(internal.stateKey, /^identity:/);
  assert.notEqual(whatsapp.identity.identityId, internal.identity.identityId);
  assert.notEqual(whatsapp.stateKey, internal.stateKey);
});
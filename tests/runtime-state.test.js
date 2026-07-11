import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createDefaultElanAIRuntime
} from '../src/core/index.js';

test('Runtime integra State por canal y sesion', async () => {
  const runtime = createDefaultElanAIRuntime();

  const result = await runtime.process('whatsapp', {
    from: '50588888888',
    body: 'Necesito una cotizacion'
  });

  assert.equal(result.status, 'COMPLETED');
  assert.equal(result.stateKey, 'whatsapp:50588888888');
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

test('Runtime separa State por plataforma', async () => {
  const runtime = createDefaultElanAIRuntime();

  const whatsapp = await runtime.process('whatsapp', {
    from: 'shared-user',
    body: 'Hola'
  });

  const internal = await runtime.process('internal', {
    externalUserId: 'shared-user',
    message: 'Hola'
  });

  assert.equal(whatsapp.stateKey, 'whatsapp:shared-user');
  assert.equal(internal.stateKey, 'internal:shared-user');
  assert.notEqual(whatsapp.stateKey, internal.stateKey);
});
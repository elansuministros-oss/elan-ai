import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createDefaultElanAIRuntime
} from '../src/core/index.js';

test('Runtime crea identidad canonica en primer contacto', async () => {
  const runtime = createDefaultElanAIRuntime();

  const result = await runtime.process('whatsapp', {
    from: 'wa-001',
    body: 'Hola',
    phone: '+505 8111-2233',
    displayName: 'Cliente Uno'
  });

  assert.equal(result.status, 'COMPLETED');
  assert.equal(result.identityCreated, true);
  assert.equal(result.identityMerged, false);
  assert.equal(result.identity.phone, '50581112233');
  assert.equal(result.sessionId, result.identity.identityId);
  assert.equal(result.stateKey, `identity:${result.identity.identityId}`);
});

test('Runtime reutiliza identidad en el mismo canal', async () => {
  const runtime = createDefaultElanAIRuntime();

  const first = await runtime.process('whatsapp', {
    from: 'wa-002',
    body: 'Hola'
  });

  const second = await runtime.process('whatsapp', {
    from: 'wa-002',
    body: 'Necesito precio'
  });

  assert.equal(
    second.identity.identityId,
    first.identity.identityId
  );
  assert.equal(second.identityCreated, false);
  assert.equal(second.memory.messages.length, 4);
});

test('Runtime fusiona identidad entre WhatsApp e Internal por telefono', async () => {
  const runtime = createDefaultElanAIRuntime();

  const whatsapp = await runtime.process('whatsapp', {
    from: 'wa-003',
    body: 'Hola',
    phone: '+505 8222-3344'
  });

  const internal = await runtime.process('internal', {
    externalUserId: 'crm-003',
    message: 'Seguimiento',
    phone: '50582223344'
  });

  assert.equal(
    internal.identity.identityId,
    whatsapp.identity.identityId
  );
  assert.equal(internal.identityMerged, true);
  assert.equal(internal.identity.links.length, 2);
  assert.equal(internal.memory.messages.length, 4);
  assert.equal(internal.stateKey, whatsapp.stateKey);
});

test('Runtime mantiene identidades separadas sin coincidencia', async () => {
  const runtime = createDefaultElanAIRuntime();

  const first = await runtime.process('whatsapp', {
    from: 'wa-a',
    body: 'Hola'
  });

  const second = await runtime.process('whatsapp', {
    from: 'wa-b',
    body: 'Hola'
  });

  assert.notEqual(
    first.identity.identityId,
    second.identity.identityId
  );
});
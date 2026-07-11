import assert from 'node:assert/strict';
import test from 'node:test';
import {
  IdentityEngine,
  InMemoryIdentityAdapter
} from '../src/identity/index.js';

test('IdentityEngine crea identidad nueva', async () => {
  const engine = new IdentityEngine(
    new InMemoryIdentityAdapter()
  );

  const result = await engine.resolve({
    channel: 'whatsapp',
    externalUserId: '50588888888',
    phone: '+505 8888-8888',
    displayName: 'Cliente Uno'
  });

  assert.equal(result.created, true);
  assert.equal(result.identity.phone, '50588888888');
  assert.equal(result.identity.links.length, 1);
});

test('IdentityEngine recupera la misma identidad por canal', async () => {
  const engine = new IdentityEngine(
    new InMemoryIdentityAdapter()
  );

  const first = await engine.resolve({
    channel: 'whatsapp',
    externalUserId: '50577777777'
  });

  const second = await engine.resolve({
    channel: 'whatsapp',
    externalUserId: '50577777777'
  });

  assert.equal(second.created, false);
  assert.equal(
    second.identity.identityId,
    first.identity.identityId
  );
});

test('IdentityEngine fusiona plataformas por telefono', async () => {
  const engine = new IdentityEngine(
    new InMemoryIdentityAdapter()
  );

  const whatsapp = await engine.resolve({
    channel: 'whatsapp',
    externalUserId: 'wa-001',
    phone: '+505 8111-2233'
  });

  const web = await engine.resolve({
    channel: 'web',
    externalUserId: 'web-user-99',
    phone: '50581112233'
  });

  assert.equal(web.created, false);
  assert.equal(web.merged, true);
  assert.equal(
    web.identity.identityId,
    whatsapp.identity.identityId
  );
  assert.equal(web.identity.links.length, 2);
});

test('IdentityEngine fusiona plataformas por email', async () => {
  const engine = new IdentityEngine(
    new InMemoryIdentityAdapter()
  );

  const first = await engine.resolve({
    channel: 'web',
    externalUserId: 'web-001',
    email: 'CLIENTE@EJEMPLO.COM'
  });

  const second = await engine.resolve({
    channel: 'internal',
    externalUserId: 'crm-001',
    email: 'cliente@ejemplo.com'
  });

  assert.equal(
    first.identity.identityId,
    second.identity.identityId
  );
  assert.equal(second.identity.links.length, 2);
});

test('IdentityEngine mantiene identidades separadas sin coincidencia', async () => {
  const engine = new IdentityEngine(
    new InMemoryIdentityAdapter()
  );

  const first = await engine.resolve({
    channel: 'whatsapp',
    externalUserId: 'wa-a'
  });

  const second = await engine.resolve({
    channel: 'whatsapp',
    externalUserId: 'wa-b'
  });

  assert.notEqual(
    first.identity.identityId,
    second.identity.identityId
  );
});
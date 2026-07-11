import assert from 'node:assert/strict';
import test from 'node:test';
import {
  IdentityEngine
} from '../src/identity/index.js';

test('IdentityEngine soporta adapter asincrono', async () => {
  const stored = [];

  const adapter = {
    async save(identity) {
      stored.push(structuredClone(identity));
      return structuredClone(identity);
    },
    async findByExternal() {
      return null;
    },
    async list() {
      return stored.map((item) => structuredClone(item));
    },
    async getById(identityId) {
      return stored.find((item) => item.identityId === identityId) ?? null;
    }
  };

  const engine = new IdentityEngine(adapter);

  const result = await engine.resolve({
    channel: 'whatsapp',
    externalUserId: 'async-001'
  });

  assert.equal(result.created, true);
  assert.equal(typeof result.identity.identityId, 'string');
});

test('IdentityEngine espera el resultado real del adapter', async () => {
  let saved = false;

  const adapter = {
    async save(identity) {
      await new Promise((resolve) => setTimeout(resolve, 5));
      saved = true;
      return structuredClone(identity);
    },
    async findByExternal() {
      return null;
    },
    async list() {
      return [];
    },
    async getById() {
      return null;
    }
  };

  const engine = new IdentityEngine(adapter);

  const result = await engine.resolve({
    channel: 'internal',
    externalUserId: 'async-002'
  });

  assert.equal(saved, true);
  assert.equal(result.created, true);
});
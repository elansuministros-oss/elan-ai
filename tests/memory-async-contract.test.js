import assert from 'node:assert/strict';
import test from 'node:test';
import {
  MemoryEngine
} from '../src/memory/index.js';

test('MemoryEngine soporta adapter asincrono', async () => {
  const sessions = new Map();

  const adapter = {
    async save(session) {
      await new Promise((resolve) => setTimeout(resolve, 5));
      sessions.set(session.sessionId, structuredClone(session));
      return structuredClone(session);
    },
    async get(sessionId) {
      const session = sessions.get(sessionId);
      return session ? structuredClone(session) : null;
    },
    async delete(sessionId) {
      return sessions.delete(sessionId);
    },
    async list() {
      return Array.from(
        sessions.values(),
        (session) => structuredClone(session)
      );
    }
  };

  const memory = new MemoryEngine(adapter);

  await memory.appendMessage('ASYNC-1', 'user', 'Hola');

  const session = await memory.getSession('ASYNC-1');

  assert.equal(session.messages.length, 1);
  assert.equal(session.messages[0].content, 'Hola');
});

test('MemoryEngine espera persistencia antes de responder', async () => {
  let saved = false;

  const adapter = {
    async save(session) {
      await new Promise((resolve) => setTimeout(resolve, 5));
      saved = true;
      return structuredClone(session);
    },
    async get() {
      return null;
    },
    async delete() {
      return false;
    },
    async list() {
      return [];
    }
  };

  const memory = new MemoryEngine(adapter);

  await memory.createSession('ASYNC-2');

  assert.equal(saved, true);
});
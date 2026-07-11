import assert from 'node:assert/strict';
import test from 'node:test';
import {
  InMemoryMemoryAdapter,
  MemoryEngine
} from '../src/memory/index.js';

test('Memory crea y recupera sesion mediante adapter', async () => {
  const memory = new MemoryEngine(
    new InMemoryMemoryAdapter()
  );

  await memory.appendMessage('S1', 'user', 'Hola');
  await memory.appendMessage('S1', 'assistant', 'Bienvenido');

  const session = await memory.getSession('S1');

  assert.equal(session.messages.length, 2);
  assert.match(session.summary, /Hola/);
  assert.match(session.summary, /Bienvenido/);
});

test('Memory mantiene sesiones separadas', async () => {
  const memory = new MemoryEngine(
    new InMemoryMemoryAdapter()
  );

  await memory.appendMessage('A', 'user', 'Mensaje A');
  await memory.appendMessage('B', 'user', 'Mensaje B');

  const sessionA = await memory.getSession('A');
  const sessionB = await memory.getSession('B');

  assert.equal(sessionA.messages.length, 1);
  assert.equal(sessionB.messages.length, 1);
  assert.notEqual(sessionA.sessionId, sessionB.sessionId);
});

test('Memory elimina sesion', async () => {
  const memory = new MemoryEngine(
    new InMemoryMemoryAdapter()
  );

  await memory.appendMessage('TEMP', 'user', 'Temporal');

  assert.equal(await memory.deleteSession('TEMP'), true);
  assert.equal(await memory.getSession('TEMP'), null);
});

test('Memory lista sesiones', async () => {
  const memory = new MemoryEngine(
    new InMemoryMemoryAdapter()
  );

  await memory.appendMessage('A', 'user', 'Uno');
  await memory.appendMessage('B', 'user', 'Dos');

  const sessions = await memory.listSessions();

  assert.equal(sessions.length, 2);
});

test('Memory rechaza adapter invalido', () => {
  assert.throws(
    () => new MemoryEngine({}),
    /adapter valido/
  );
});
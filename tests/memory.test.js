import assert from 'node:assert/strict';
import test from 'node:test';
import {
  InMemoryMemoryAdapter,
  MemoryEngine
} from '../src/memory/index.js';

test('Memory crea y recupera sesion mediante adapter', () => {
  const memory = new MemoryEngine(
    new InMemoryMemoryAdapter()
  );

  memory.appendMessage('S1', 'user', 'Hola');
  memory.appendMessage('S1', 'assistant', 'Bienvenido');

  const session = memory.getSession('S1');

  assert.equal(session.messages.length, 2);
  assert.match(session.summary, /Hola/);
  assert.match(session.summary, /Bienvenido/);
});

test('Memory mantiene sesiones separadas', () => {
  const memory = new MemoryEngine(
    new InMemoryMemoryAdapter()
  );

  memory.appendMessage('A', 'user', 'Mensaje A');
  memory.appendMessage('B', 'user', 'Mensaje B');

  assert.equal(memory.getSession('A').messages.length, 1);
  assert.equal(memory.getSession('B').messages.length, 1);
  assert.notEqual(
    memory.getSession('A').sessionId,
    memory.getSession('B').sessionId
  );
});

test('Memory elimina sesion', () => {
  const memory = new MemoryEngine(
    new InMemoryMemoryAdapter()
  );

  memory.appendMessage('TEMP', 'user', 'Temporal');

  assert.equal(memory.deleteSession('TEMP'), true);
  assert.equal(memory.getSession('TEMP'), null);
});

test('Memory lista sesiones', () => {
  const memory = new MemoryEngine(
    new InMemoryMemoryAdapter()
  );

  memory.appendMessage('A', 'user', 'Uno');
  memory.appendMessage('B', 'user', 'Dos');

  assert.equal(memory.listSessions().length, 2);
});

test('Memory rechaza adapter invalido', () => {
  assert.throws(
    () => new MemoryEngine({}),
    /adapter valido/
  );
});
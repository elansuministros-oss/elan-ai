import assert from 'node:assert/strict';
import test from 'node:test';
import { ConversationEngine } from '../src/conversation/index.js';
import { MemoryEngine, InMemoryMemoryAdapter } from '../src/memory/index.js';

test('ConversationEngine construye ventana reciente', async () => {
  const memory = new MemoryEngine(new InMemoryMemoryAdapter());
  const engine = new ConversationEngine(memory);

  for (let index = 1; index <= 15; index += 1) {
    await engine.append('identity-1', 'user', `Mensaje ${index}`);
  }

  const conversation = await engine.build('identity-1', { limit: 5 });

  assert.equal(conversation.messages.length, 5);
  assert.equal(conversation.messages[0].content, 'Mensaje 11');
  assert.equal(conversation.turnCount, 15);
});

test('ConversationEngine responde vacio sin sesion', async () => {
  const engine = new ConversationEngine(
    new MemoryEngine(new InMemoryMemoryAdapter())
  );

  const conversation = await engine.build('missing');

  assert.equal(conversation.messages.length, 0);
  assert.equal(conversation.turnCount, 0);
});
import assert from 'node:assert/strict';
import test from 'node:test';
import { ContextBuilder } from '../src/context/index.js';

test('ContextBuilder construye contexto unificado', () => {
  const builder = new ContextBuilder();

  const result = builder.build({
    identity: {
      identityId: 'id-1',
      displayName: 'Cliente'
    },
    knowledge: [{ id: 'k-1' }],
    plan: { intent: 'quote' }
  });

  assert.equal(result.identity.identityId, 'id-1');
  assert.equal(result.knowledge.length, 1);
  assert.equal(result.plan.intent, 'quote');
});
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createConfiguredSupabaseRuntime,
  createSupabaseElanAIRuntime
} from '../src/core/index.js';

function createMinimalClient() {
  return {
    from() {
      throw new Error('No debe consultar durante la construccion');
    }
  };
}

test('Factory Supabase crea runtime por inyeccion', () => {
  const runtime = createSupabaseElanAIRuntime({
    client: createMinimalClient()
  });

  assert.equal(typeof runtime.process, 'function');
  assert.equal(typeof runtime.identityEngine.resolve, 'function');
  assert.equal(typeof runtime.memoryEngine.getSession, 'function');
  assert.equal(typeof runtime.stateEngine.get, 'function');
  assert.equal(typeof runtime.knowledgeEngine.search, 'function');
});

test('Factory Supabase rechaza cliente invalido', () => {
  assert.throws(
    () => createSupabaseElanAIRuntime({ client: {} }),
    /client Supabase/
  );
});

test('Factory configurada usa variables de entorno e inyeccion', () => {
  const calls = [];

  const clientFactory = (...args) => {
    calls.push(args);
    return createMinimalClient();
  };

  const runtime = createConfiguredSupabaseRuntime({
    env: {
      SUPABASE_URL: 'https://example.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'service-role-test'
    },
    clientFactory
  });

  assert.equal(typeof runtime.process, 'function');
  assert.equal(calls.length, 1);
  assert.equal(calls[0][0], 'https://example.supabase.co');
  assert.equal(calls[0][1], 'service-role-test');
});
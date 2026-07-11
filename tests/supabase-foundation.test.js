import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createSupabaseServerClient,
  SupabaseHealthAdapter
} from '../src/adapters/supabase/index.js';
import {
  loadSupabaseConfig
} from '../src/config/supabaseConfig.js';

test('Supabase config exige URL y service role key', () => {
  assert.throws(
    () => loadSupabaseConfig({}),
    /SUPABASE_URL requerido/
  );

  assert.throws(
    () => loadSupabaseConfig({
      SUPABASE_URL: 'https://example.supabase.co'
    }),
    /SUPABASE_SERVICE_ROLE_KEY requerido/
  );
});

test('Supabase client usa configuracion inyectada', () => {
  const calls = [];

  const fakeFactory = (...args) => {
    calls.push(args);
    return { from() {} };
  };

  const client = createSupabaseServerClient({
    env: {
      SUPABASE_URL: 'https://example.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'service-role-test'
    },
    clientFactory: fakeFactory
  });

  assert.equal(typeof client.from, 'function');
  assert.equal(calls.length, 1);
  assert.equal(calls[0][0], 'https://example.supabase.co');
  assert.equal(calls[0][1], 'service-role-test');
  assert.equal(calls[0][2].auth.persistSession, false);
});

test('Supabase health adapter reporta estado OK', async () => {
  const client = {
    from() {
      return {
        select() {
          return {
            async limit() {
              return { data: [], error: null };
            }
          };
        }
      };
    }
  };

  const adapter = new SupabaseHealthAdapter(client);
  const result = await adapter.check();

  assert.equal(result.ok, true);
  assert.equal(result.error, null);
});

test('Supabase health adapter reporta error', async () => {
  const client = {
    from() {
      return {
        select() {
          return {
            async limit() {
              return {
                data: null,
                error: { message: 'relation missing' }
              };
            }
          };
        }
      };
    }
  };

  const adapter = new SupabaseHealthAdapter(client);
  const result = await adapter.check();

  assert.equal(result.ok, false);
  assert.equal(result.error, 'relation missing');
});
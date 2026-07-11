import assert from 'node:assert/strict';
import test from 'node:test';
import {
  SupabaseStateAdapter
} from '../src/adapters/supabase/index.js';

function createMockClient() {
  const states = new Map();

  return {
    from(table) {
      if (table !== 'elan_ai_states') {
        throw new Error(`Tabla no soportada: ${table}`);
      }

      return {
        async upsert(row) {
          states.set(row.state_key, structuredClone(row));
          return { error: null };
        },
        select() {
          const filters = {};

          const chain = {
            eq(field, value) {
              filters[field] = value;
              return chain;
            },
            async maybeSingle() {
              const row = states.get(filters.state_key) || null;
              return { data: row, error: null };
            },
            then(resolve) {
              resolve({
                data: Array.from(states.values()),
                error: null
              });
            }
          };

          return chain;
        },
        delete() {
          return {
            async eq(field, value) {
              states.delete(value);
              return { error: null };
            }
          };
        }
      };
    }
  };
}

function createState() {
  return {
    key: 'identity:11111111-1111-4111-8111-111111111111',
    version: 3,
    data: {
      identityId: '11111111-1111-4111-8111-111111111111',
      phase: 'COMPLETED',
      activeIntent: 'quote'
    },
    updatedAt: '2026-07-10T00:00:03.000Z'
  };
}

test('SupabaseStateAdapter guarda y recupera estado', async () => {
  const adapter = new SupabaseStateAdapter(createMockClient());
  const state = createState();

  await adapter.save(state.key, state);

  const result = await adapter.get(state.key);

  assert.equal(result.key, state.key);
  assert.equal(result.version, 3);
  assert.equal(result.data.phase, 'COMPLETED');
  assert.equal(result.data.activeIntent, 'quote');
});

test('SupabaseStateAdapter actualiza estado existente', async () => {
  const adapter = new SupabaseStateAdapter(createMockClient());
  const state = createState();

  await adapter.save(state.key, state);

  await adapter.save(state.key, {
    ...state,
    version: 4,
    data: {
      ...state.data,
      phase: 'RECEIVED'
    },
    updatedAt: '2026-07-10T00:00:04.000Z'
  });

  const result = await adapter.get(state.key);

  assert.equal(result.version, 4);
  assert.equal(result.data.phase, 'RECEIVED');
});

test('SupabaseStateAdapter elimina estado', async () => {
  const adapter = new SupabaseStateAdapter(createMockClient());
  const state = createState();

  await adapter.save(state.key, state);

  assert.equal(await adapter.delete(state.key), true);
  assert.equal(await adapter.get(state.key), null);
});

test('SupabaseStateAdapter lista estados', async () => {
  const adapter = new SupabaseStateAdapter(createMockClient());
  const state = createState();

  await adapter.save(state.key, state);

  const list = await adapter.list();

  assert.equal(list.length, 1);
  assert.equal(list[0].key, state.key);
  assert.equal(list[0].value.version, 3);
});

test('SupabaseStateAdapter rechaza client invalido', () => {
  assert.throws(
    () => new SupabaseStateAdapter({}),
    /client valido/
  );
});
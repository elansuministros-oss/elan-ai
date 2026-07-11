import assert from 'node:assert/strict';
import test from 'node:test';
import {
  SupabaseIdentityAdapter
} from '../src/adapters/supabase/index.js';

function createMockClient() {
  const identities = new Map();
  const links = new Map();

  return {
    from(table) {
      if (table === 'elan_ai_identities') {
        return {
          async upsert(row) {
            identities.set(row.identity_id, structuredClone(row));
            return { error: null };
          },
          select() {
            return {
              eq(field, value) {
                return {
                  async maybeSingle() {
                    const row = identities.get(value) || null;
                    return { data: row, error: null };
                  }
                };
              },
              then(resolve) {
                resolve({
                  data: Array.from(identities.values()),
                  error: null
                });
              }
            };
          }
        };
      }

      if (table === 'elan_ai_identity_links') {
        return {
          async upsert(rows) {
            for (const row of rows) {
              links.set(
                `${row.channel}:${row.external_user_id}`,
                structuredClone(row)
              );
            }

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
                const row = links.get(
                  `${filters.channel}:${filters.external_user_id}`
                ) || null;

                return { data: row, error: null };
              },
              then(resolve) {
                const data = Array.from(links.values()).filter(
                  (row) => row.identity_id === filters.identity_id
                );

                resolve({ data, error: null });
              }
            };

            return chain;
          }
        };
      }

      throw new Error(`Tabla no soportada: ${table}`);
    }
  };
}

test('SupabaseIdentityAdapter guarda y recupera identidad', async () => {
  const adapter = new SupabaseIdentityAdapter(createMockClient());

  const identity = {
    identityId: '11111111-1111-4111-8111-111111111111',
    displayName: 'Cliente Uno',
    phone: '50581112233',
    email: 'cliente@ejemplo.com',
    links: [
      {
        channel: 'whatsapp',
        externalUserId: 'wa-001'
      }
    ],
    metadata: {
      source: 'test'
    },
    createdAt: '2026-07-10T00:00:00.000Z',
    updatedAt: '2026-07-10T00:00:00.000Z'
  };

  await adapter.save(identity);

  const result = await adapter.getById(identity.identityId);

  assert.equal(result.identityId, identity.identityId);
  assert.equal(result.displayName, 'Cliente Uno');
  assert.equal(result.links.length, 1);
  assert.equal(result.links[0].channel, 'whatsapp');
});

test('SupabaseIdentityAdapter resuelve por canal externo', async () => {
  const adapter = new SupabaseIdentityAdapter(createMockClient());

  const identity = {
    identityId: '22222222-2222-4222-8222-222222222222',
    displayName: null,
    phone: '50582223344',
    email: null,
    links: [
      {
        channel: 'whatsapp',
        externalUserId: 'wa-002'
      }
    ],
    metadata: {},
    createdAt: '2026-07-10T00:00:00.000Z',
    updatedAt: '2026-07-10T00:00:00.000Z'
  };

  await adapter.save(identity);

  const result = await adapter.findByExternal(
    'whatsapp',
    'wa-002'
  );

  assert.equal(result.identityId, identity.identityId);
  assert.equal(result.phone, '50582223344');
});

test('SupabaseIdentityAdapter devuelve null cuando no existe', async () => {
  const adapter = new SupabaseIdentityAdapter(createMockClient());

  const result = await adapter.findByExternal(
    'whatsapp',
    'missing'
  );

  assert.equal(result, null);
});

test('SupabaseIdentityAdapter rechaza client invalido', () => {
  assert.throws(
    () => new SupabaseIdentityAdapter({}),
    /client valido/
  );
});
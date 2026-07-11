import assert from 'node:assert/strict';
import test from 'node:test';
import {
  SupabaseMemoryAdapter
} from '../src/adapters/supabase/index.js';

function createMockClient() {
  const sessions = new Map();
  const messages = [];

  return {
    from(table) {
      if (table === 'elan_ai_memory_sessions') {
        return {
          async upsert(row) {
            sessions.set(row.session_id, structuredClone(row));
            return { error: null };
          },
          select(columns = '*') {
            const filters = {};

            const chain = {
              eq(field, value) {
                filters[field] = value;
                return chain;
              },
              async maybeSingle() {
                const row = sessions.get(filters.session_id) || null;
                return { data: row, error: null };
              },
              then(resolve) {
                const data = columns === 'session_id'
                  ? Array.from(sessions.values(), (row) => ({
                      session_id: row.session_id
                    }))
                  : Array.from(sessions.values());

                resolve({ data, error: null });
              }
            };

            return chain;
          },
          delete() {
            const chain = {
              async eq(field, value) {
                sessions.delete(value);

                for (let index = messages.length - 1; index >= 0; index -= 1) {
                  if (messages[index].session_id === value) {
                    messages.splice(index, 1);
                  }
                }

                return { error: null };
              }
            };

            return chain;
          }
        };
      }

      if (table === 'elan_ai_memory_messages') {
        return {
          async insert(rows) {
            messages.push(...rows.map((row) => structuredClone(row)));
            return { error: null };
          },
          delete() {
            const chain = {
              async eq(field, value) {
                for (let index = messages.length - 1; index >= 0; index -= 1) {
                  if (messages[index][field] === value) {
                    messages.splice(index, 1);
                  }
                }

                return { error: null };
              }
            };

            return chain;
          },
          select() {
            const filters = {};

            const chain = {
              eq(field, value) {
                filters[field] = value;
                return chain;
              },
              async order() {
                const data = messages
                  .filter((row) => row.session_id === filters.session_id)
                  .sort((a, b) =>
                    a.created_at.localeCompare(b.created_at)
                  )
                  .map((row) => ({
                    role: row.role,
                    content: row.content,
                    created_at: row.created_at
                  }));

                return { data, error: null };
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

function createSession() {
  return {
    sessionId: '11111111-1111-4111-8111-111111111111',
    messages: [
      {
        role: 'user',
        content: 'Hola',
        at: '2026-07-10T00:00:01.000Z'
      },
      {
        role: 'assistant',
        content: 'Bienvenido',
        at: '2026-07-10T00:00:02.000Z'
      }
    ],
    summary: '[user] Hola | [assistant] Bienvenido',
    createdAt: '2026-07-10T00:00:00.000Z',
    updatedAt: '2026-07-10T00:00:02.000Z'
  };
}

test('SupabaseMemoryAdapter guarda y recupera sesion', async () => {
  const adapter = new SupabaseMemoryAdapter(createMockClient());
  const session = createSession();

  await adapter.save(session);

  const result = await adapter.get(session.sessionId);

  assert.equal(result.sessionId, session.sessionId);
  assert.equal(result.messages.length, 2);
  assert.equal(result.messages[0].content, 'Hola');
  assert.equal(result.summary, session.summary);
});

test('SupabaseMemoryAdapter reemplaza mensajes al guardar', async () => {
  const adapter = new SupabaseMemoryAdapter(createMockClient());
  const session = createSession();

  await adapter.save(session);

  await adapter.save({
    ...session,
    messages: [
      ...session.messages,
      {
        role: 'user',
        content: 'Necesito precio',
        at: '2026-07-10T00:00:03.000Z'
      }
    ],
    updatedAt: '2026-07-10T00:00:03.000Z'
  });

  const result = await adapter.get(session.sessionId);

  assert.equal(result.messages.length, 3);
  assert.equal(result.messages[2].content, 'Necesito precio');
});

test('SupabaseMemoryAdapter elimina sesion', async () => {
  const adapter = new SupabaseMemoryAdapter(createMockClient());
  const session = createSession();

  await adapter.save(session);

  assert.equal(await adapter.delete(session.sessionId), true);
  assert.equal(await adapter.get(session.sessionId), null);
});

test('SupabaseMemoryAdapter lista sesiones', async () => {
  const adapter = new SupabaseMemoryAdapter(createMockClient());
  const session = createSession();

  await adapter.save(session);

  const list = await adapter.list();

  assert.equal(list.length, 1);
  assert.equal(list[0].sessionId, session.sessionId);
});

test('SupabaseMemoryAdapter rechaza client invalido', () => {
  assert.throws(
    () => new SupabaseMemoryAdapter({}),
    /client valido/
  );
});
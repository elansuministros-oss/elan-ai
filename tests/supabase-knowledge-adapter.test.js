import assert from 'node:assert/strict';
import test from 'node:test';
import {
  SupabaseKnowledgeAdapter
} from '../src/adapters/supabase/index.js';

function createMockClient() {
  const records = new Map();

  return {
    from(table) {
      if (table !== 'elan_ai_knowledge') {
        throw new Error(`Tabla no soportada: ${table}`);
      }

      return {
        async upsert(row) {
          records.set(row.knowledge_id, structuredClone(row));
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
              return {
                data: records.get(filters.knowledge_id) || null,
                error: null
              };
            },
            then(resolve) {
              resolve({
                data: Array.from(records.values()),
                error: null
              });
            }
          };

          return chain;
        }
      };
    }
  };
}

function createRecord() {
  return {
    id: 'emc-pvc-3mm',
    title: 'PVC 3 mm',
    content: 'Material base para rotulacion interior',
    source: 'EMC',
    type: 'material',
    metadata: { unit: 'sheet' },
    createdAt: '2026-07-10T00:00:00.000Z',
    updatedAt: '2026-07-10T00:00:00.000Z'
  };
}

test('SupabaseKnowledgeAdapter guarda y recupera registro', async () => {
  const adapter = new SupabaseKnowledgeAdapter(createMockClient());
  const record = createRecord();

  await adapter.save(record);
  const result = await adapter.getById(record.id);

  assert.equal(result.id, record.id);
  assert.equal(result.title, 'PVC 3 mm');
  assert.equal(result.source, 'EMC');
  assert.equal(result.metadata.unit, 'sheet');
});

test('SupabaseKnowledgeAdapter lista registros', async () => {
  const adapter = new SupabaseKnowledgeAdapter(createMockClient());

  await adapter.save(createRecord());

  const list = await adapter.list();

  assert.equal(list.length, 1);
  assert.equal(list[0].id, 'emc-pvc-3mm');
});

test('SupabaseKnowledgeAdapter devuelve null si no existe', async () => {
  const adapter = new SupabaseKnowledgeAdapter(createMockClient());

  const result = await adapter.getById('missing');

  assert.equal(result, null);
});

test('SupabaseKnowledgeAdapter rechaza client invalido', () => {
  assert.throws(
    () => new SupabaseKnowledgeAdapter({}),
    /client valido/
  );
});
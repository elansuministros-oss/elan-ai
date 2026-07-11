import assert from 'node:assert/strict';
import test from 'node:test';
import {
  KnowledgeEngine
} from '../src/knowledge/index.js';

test('KnowledgeEngine soporta adapter asincrono', async () => {
  const records = new Map();

  const adapter = {
    async save(record) {
      await new Promise((resolve) => setTimeout(resolve, 5));
      records.set(record.id, structuredClone(record));
      return structuredClone(record);
    },
    async getById(id) {
      const record = records.get(id);
      return record ? structuredClone(record) : null;
    },
    async list() {
      return Array.from(
        records.values(),
        (record) => structuredClone(record)
      );
    }
  };

  const knowledge = new KnowledgeEngine(adapter);

  await knowledge.register({
    id: 'async-001',
    title: 'Documento async',
    content: 'Contenido persistido',
    source: 'TEST'
  });

  const result = await knowledge.getById('async-001');

  assert.equal(result.title, 'Documento async');
});

test('KnowledgeEngine espera persistencia antes de responder', async () => {
  let saved = false;

  const adapter = {
    async save(record) {
      await new Promise((resolve) => setTimeout(resolve, 5));
      saved = true;
      return structuredClone(record);
    },
    async getById() {
      return null;
    },
    async list() {
      return [];
    }
  };

  const knowledge = new KnowledgeEngine(adapter);

  await knowledge.register({
    id: 'async-002',
    title: 'Persistencia',
    content: 'Validacion',
    source: 'TEST'
  });

  assert.equal(saved, true);
});
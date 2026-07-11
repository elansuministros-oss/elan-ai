import assert from 'node:assert/strict';
import test from 'node:test';
import {
  InMemoryKnowledgeAdapter,
  KnowledgeEngine
} from '../src/knowledge/index.js';

test('Knowledge registra y recupera conocimiento', async () => {
  const adapter = new InMemoryKnowledgeAdapter();
  const knowledge = new KnowledgeEngine(adapter);

  await knowledge.register({
    id: 'emc-pvc-3mm',
    title: 'PVC 3 mm',
    content: 'Material base para rotulacion interior',
    source: 'EMC',
    type: 'material'
  });

  const record = await knowledge.getById('emc-pvc-3mm');

  assert.equal(record.title, 'PVC 3 mm');
  assert.equal(record.source, 'EMC');
  assert.equal(record.type, 'material');
});

test('Knowledge busca por contenido y fuente', async () => {
  const adapter = new InMemoryKnowledgeAdapter();
  const knowledge = new KnowledgeEngine(adapter);

  await knowledge.register({
    id: 'emc-acrilico',
    title: 'Acrilico transparente',
    content: 'Plancha para rotulos premium',
    source: 'EMC',
    type: 'material'
  });

  await knowledge.register({
    id: 'manual-ventas',
    title: 'Manual comercial',
    content: 'Proceso de seguimiento de clientes',
    source: 'MANUAL',
    type: 'policy'
  });

  const results = await knowledge.search('EMC acrilico');

  assert.equal(results.length, 1);
  assert.equal(results[0].id, 'emc-acrilico');
  assert.equal(results[0].score, 2);
});

test('Knowledge permanece separado de conversaciones', async () => {
  const adapter = new InMemoryKnowledgeAdapter();
  const knowledge = new KnowledgeEngine(adapter);

  await knowledge.register({
    id: 'politica-001',
    title: 'Politica de anticipo',
    content: 'El anticipo comercial es 60 por ciento',
    source: 'BUSINESS',
    type: 'policy'
  });

  const result = await knowledge.getById('politica-001');

  assert.equal(Object.hasOwn(result, 'messages'), false);
  assert.equal(Object.hasOwn(result, 'sessionId'), false);
});
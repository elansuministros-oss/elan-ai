import assert from 'node:assert/strict';
import test from 'node:test';
import {
  InMemoryStateAdapter,
  StateEngine
} from '../src/state/index.js';

test('StateEngine crea y recupera estado', async () => {
  const state = new StateEngine(new InMemoryStateAdapter());

  await state.set('conversation:001', {
    phase: 'DISCOVERY',
    activeProduct: 'rotulo'
  });

  const result = await state.get('conversation:001');

  assert.equal(result.key, 'conversation:001');
  assert.equal(result.version, 1);
  assert.equal(result.data.phase, 'DISCOVERY');
  assert.equal(result.data.activeProduct, 'rotulo');
});

test('StateEngine incrementa version al actualizar', async () => {
  const state = new StateEngine(new InMemoryStateAdapter());

  await state.set('conversation:002', {
    phase: 'DISCOVERY'
  });

  const updated = await state.patch('conversation:002', {
    phase: 'QUOTING'
  });

  assert.equal(updated.version, 2);
  assert.equal(updated.data.phase, 'QUOTING');
});

test('StateEngine mantiene estados separados', async () => {
  const state = new StateEngine(new InMemoryStateAdapter());

  await state.set('whatsapp:50511111111', {
    platform: 'ELANVISUAL'
  });

  await state.set('web:user-22', {
    platform: 'CENTRO_CONTROL'
  });

  assert.equal(
    (await state.get('whatsapp:50511111111')).data.platform,
    'ELANVISUAL'
  );

  assert.equal(
    (await state.get('web:user-22')).data.platform,
    'CENTRO_CONTROL'
  );
});

test('StateEngine elimina estado', async () => {
  const state = new StateEngine(new InMemoryStateAdapter());

  await state.set('temporary', {
    active: true
  });

  assert.equal(await state.remove('temporary'), true);
  assert.equal(await state.get('temporary'), null);
});

test('StateEngine rechaza patch inexistente', async () => {
  const state = new StateEngine(new InMemoryStateAdapter());

  await assert.rejects(
    () => state.patch('missing', { phase: 'TEST' }),
    /State no encontrado/
  );
});
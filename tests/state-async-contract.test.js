import assert from 'node:assert/strict';
import test from 'node:test';
import {
  StateEngine
} from '../src/state/index.js';

test('StateEngine soporta adapter asincrono', async () => {
  const states = new Map();

  const adapter = {
    async save(key, value) {
      await new Promise((resolve) => setTimeout(resolve, 5));
      states.set(key, structuredClone(value));
      return structuredClone(value);
    },
    async get(key) {
      const value = states.get(key);
      return value ? structuredClone(value) : null;
    },
    async delete(key) {
      return states.delete(key);
    },
    async list() {
      return Array.from(
        states.entries(),
        ([key, value]) => ({
          key,
          value: structuredClone(value)
        })
      );
    }
  };

  const state = new StateEngine(adapter);

  await state.set('async:001', {
    phase: 'READY'
  });

  const result = await state.get('async:001');

  assert.equal(result.data.phase, 'READY');
});

test('StateEngine espera persistencia antes de responder', async () => {
  let saved = false;

  const adapter = {
    async save(key, value) {
      await new Promise((resolve) => setTimeout(resolve, 5));
      saved = true;
      return structuredClone(value);
    },
    async get() {
      return null;
    },
    async delete() {
      return false;
    },
    async list() {
      return [];
    }
  };

  const state = new StateEngine(adapter);

  await state.set('async:002', {
    phase: 'READY'
  });

  assert.equal(saved, true);
});
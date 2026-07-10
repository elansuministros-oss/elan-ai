import assert from 'node:assert/strict';
import test from 'node:test';
import { Planner } from '../src/planner/index.js';

test('Planner crea plan de cotizacion', () => {
  const planner = new Planner();

  const plan = planner.createPlan({
    requestId: 'req-001',
    channel: 'whatsapp',
    message: 'Necesito una cotizacion para un rotulo'
  });

  assert.equal(plan.planId, 'plan-req-001');
  assert.equal(plan.intent, 'quote');
  assert.equal(plan.selectedOperator, 'sales');
  assert.equal(plan.classificationSource, 'RULE');
  assert.equal(plan.status, 'PLANNED');
  assert.deepEqual(plan.steps, [
    'LOAD_MEMORY',
    'LOAD_KNOWLEDGE',
    'EXECUTE_REASONING',
    'EXECUTE_OPERATOR',
    'BUILD_RESPONSE',
    'SAVE_MEMORY'
  ]);
});

test('Planner usa fallback general', () => {
  const planner = new Planner();

  const plan = planner.createPlan({
    requestId: 'req-002',
    channel: 'web',
    message: 'Hola'
  });

  assert.equal(plan.intent, 'general');
  assert.equal(plan.selectedOperator, 'general');
  assert.equal(plan.classificationSource, 'FALLBACK');
});

test('Planner rechaza contexto sin requestId', () => {
  const planner = new Planner();

  assert.throws(
    () => planner.createPlan({ message: 'Hola' }),
    /requestId/
  );
});
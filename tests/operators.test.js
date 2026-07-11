import assert from 'node:assert/strict';
import test from 'node:test';
import {
  BaseOperator,
  GeneralOperator,
  OperatorRegistry,
  SalesOperator,
  TaskOperator,
  createDefaultOperatorRegistry
} from '../src/operators/index.js';

test('OperatorRegistry registra y ejecuta operador', async () => {
  const registry = new OperatorRegistry();
  registry.register(new GeneralOperator());

  const result = await registry.execute('general', {
    context: {
      requestId: 'req-001',
      message: 'Hola'
    },
    reasoning: {
      requestId: 'req-001',
      text: 'Respuesta general'
    }
  });

  assert.equal(result.operator, 'general');
  assert.equal(result.requestId, 'req-001');
  assert.equal(result.response, 'Respuesta general');
  assert.equal(result.status, 'COMPLETED');
});

test('SalesOperator devuelve accion comercial pendiente', async () => {
  const operator = new SalesOperator();

  const result = await operator.execute({
    context: {
      requestId: 'req-002',
      message: 'Necesito cotizacion'
    },
    reasoning: {
      requestId: 'req-002',
      text: 'Preparando contexto comercial'
    }
  });

  assert.equal(result.operator, 'sales');
  assert.equal(result.actions.length, 1);
  assert.equal(result.actions[0].type, 'CAPTURE_SALES_CONTEXT');
  assert.equal(result.actions[0].status, 'PENDING');
});

test('TaskOperator ejecuta operadores funcionales base', async () => {
  const operator = new TaskOperator('crm');

  const result = await operator.execute({
    context: {
      requestId: 'req-003',
      message: 'Seguimiento'
    },
    reasoning: {
      requestId: 'req-003',
      text: 'Gestionando seguimiento'
    }
  });

  assert.equal(result.operator, 'crm');
  assert.equal(result.response, 'Gestionando seguimiento');
  assert.equal(result.status, 'COMPLETED');
});

test('Registry por defecto cubre todos los operadores del Planner', () => {
  const registry = createDefaultOperatorRegistry();

  assert.deepEqual(
    registry.list(),
    ['general', 'sales', 'crm', 'support', 'production']
  );
});

test('OperatorRegistry rechaza duplicados', () => {
  const registry = new OperatorRegistry();
  registry.register(new GeneralOperator());

  assert.throws(
    () => registry.register(new GeneralOperator()),
    /Operator duplicado/
  );
});

test('BaseOperator exige implementacion concreta', async () => {
  const operator = new BaseOperator('base');

  await assert.rejects(
    () => operator.execute(),
    /debe implementar execute/
  );
});
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  BaseOperator,
  GeneralOperator,
  OperatorRegistry,
  SalesOperator,
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

test('Registry por defecto contiene general y sales', () => {
  const registry = createDefaultOperatorRegistry();

  assert.deepEqual(registry.list(), ['general', 'sales']);
  assert.equal(registry.has('general'), true);
  assert.equal(registry.has('sales'), true);
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
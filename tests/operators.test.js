import assert from 'node:assert/strict';
import test from 'node:test';
import {
  BaseOperator,
  CrmOperator,
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
    context: { requestId: 'req-001', message: 'Hola' },
    reasoning: { requestId: 'req-001', text: 'Respuesta general' }
  });

  assert.equal(result.operator, 'general');
  assert.equal(result.requestId, 'req-001');
  assert.equal(result.response, 'Respuesta general');
  assert.equal(result.status, 'COMPLETED');
});

test('SalesOperator devuelve accion comercial pendiente', async () => {
  const operator = new SalesOperator();
  const result = await operator.execute({
    context: { requestId: 'req-002', message: 'Necesito cotizacion' },
    reasoning: { requestId: 'req-002', text: 'Preparando contexto comercial' }
  });

  assert.equal(result.operator, 'sales');
  assert.equal(result.actions.length, 1);
  assert.equal(result.actions[0].type, 'CAPTURE_SALES_CONTEXT');
  assert.equal(result.actions[0].status, 'PENDING');
});

test('TaskOperator ejecuta operadores funcionales base', async () => {
  const operator = new TaskOperator('support');
  const result = await operator.execute({
    context: { requestId: 'req-003', message: 'Seguimiento' },
    reasoning: { requestId: 'req-003', text: 'Gestionando seguimiento' }
  });

  assert.equal(result.operator, 'support');
  assert.equal(result.response, 'Gestionando seguimiento');
  assert.equal(result.status, 'COMPLETED');
});

test('CrmOperator extrae tres proveedores completos', async () => {
  const operator = new CrmOperator();
  const result = await operator.execute({
    context: {
      requestId: 'req-crm-001',
      message: `Proveedor 1
Nombre comercial: Eskolor
Teléfono: +505 8244 3621
Productos y servicios: Viniles adhesivos e impresión digital.

Proveedor 2
Nombre comercial: IMPRESIONES VIDA
Teléfono: +505 8196-0104
Productos y servicios: Impresión, CNC y señalización.

Proveedor 3
Nombre comercial: LED Solutions Nicaragua
Teléfono: +505 7827-3819
Productos y servicios: Productos 3M, cajas de luz y cintas VHB.`
    }
  });

  assert.equal(result.status, 'COMPLETED');
  assert.equal(result.suppliers.length, 3);
  assert.deepEqual(result.suppliers.map((item) => item.name), [
    'Eskolor',
    'IMPRESIONES VIDA',
    'LED Solutions Nicaragua'
  ]);
  assert.doesNotMatch(result.response, /decime el nombre/i);
});

test('CrmOperator no registra proveedores incompletos', async () => {
  const operator = new CrmOperator();
  const result = await operator.execute({
    context: {
      requestId: 'req-crm-002',
      message: 'Proveedor 1\nNombre comercial: Sin datos'
    }
  });

  assert.equal(result.status, 'NEEDS_DATA');
  assert.equal(result.suppliers.length, 0);
});

test('Registry por defecto cubre todos los operadores del Planner', () => {
  const registry = createDefaultOperatorRegistry();
  assert.deepEqual(registry.list(), ['general', 'sales', 'crm', 'support', 'production']);
});

test('OperatorRegistry rechaza duplicados', () => {
  const registry = new OperatorRegistry();
  registry.register(new GeneralOperator());
  assert.throws(() => registry.register(new GeneralOperator()), /Operator duplicado/);
});

test('BaseOperator exige implementacion concreta', async () => {
  const operator = new BaseOperator('base');
  await assert.rejects(() => operator.execute(), /debe implementar execute/);
});

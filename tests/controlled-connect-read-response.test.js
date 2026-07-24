import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildControlledConnectReadResponse
} from '../src/responses/index.js';

function tool(operation, result) {
  return [{
    toolName: 'connect',
    status: 'SUCCESS',
    data: { operation, result }
  }];
}

test('resume cotizaciones sin exponer ids ni JSON', () => {
  const response = buildControlledConnectReadResponse(
    tool('quotes.list', {
      data: [{
        id: 'private-uuid',
        quoteNumber: 'COT-2026-001',
        status: 'sent',
        total: 1250,
        currency: 'USD'
      }],
      pagination: { total: 1 }
    })
  );

  assert.equal(
    response,
    [
      'Cotizaciones: 1.',
      '1. COT-2026-001 — enviada · USD 1,250.00'
    ].join('\n')
  );
  assert.equal(response.includes('private-uuid'), false);
  assert.equal(response.includes('{'), false);
});

test('limita resultados visibles e informa el total', () => {
  const records = Array.from({ length: 8 }, (_, index) => ({
    displayName: `Cliente ${index + 1}`,
    status: 'active'
  }));
  const response = buildControlledConnectReadResponse(
    tool('customers.list', { items: records, totalCount: 8 })
  );

  assert.match(response, /^Clientes: 8\./);
  assert.match(response, /5\. Cliente 5 — activo/);
  assert.match(response, /Mostrando 5 de 8\.$/);
  assert.equal(response.includes('Cliente 6'), false);
});

test('produce una respuesta clara para colecciones vacías', () => {
  assert.equal(
    buildControlledConnectReadResponse(
      tool('orders.list', { data: [], total: 0 })
    ),
    'No hay órdenes registradas.'
  );
});

test('ignora herramientas y operaciones fuera del contrato controlado', () => {
  assert.equal(buildControlledConnectReadResponse([]), null);
  assert.equal(
    buildControlledConnectReadResponse(
      tool('quotes.create', [{ quoteNumber: 'COT-001' }])
    ),
    null
  );
});

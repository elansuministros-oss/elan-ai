import assert from 'node:assert/strict';
import test from 'node:test';
import {
  resolveControlledConnectReadAction
} from '../src/actions/index.js';

function context(overrides = {}) {
  return {
    message: 'Revisá mis cotizaciones',
    metadata: {
      mode: 'active',
      ownerMode: true,
      platform: 'elanvisual',
      permissions: ['connect:quotes:read']
    },
    ...overrides
  };
}

test('traduce una consulta del propietario a quotes.list', () => {
  const action = resolveControlledConnectReadAction(context());

  assert.equal(action.toolName, 'connect');
  assert.equal(action.input.operation, 'quotes.list');
  assert.deepEqual(action.input.input, { platform: 'elanvisual' });
  assert.equal(action.input.mode, 'active');
});

test('reconoce mostrame como consulta del propietario', () => {
  const action = resolveControlledConnectReadAction({
    message: 'Mostrame las órdenes',
    metadata: {
      mode: 'active',
      ownerMode: true,
      permissions: ['connect:orders:read']
    }
  });

  assert.ok(action);
  assert.equal(action.input.operation, 'orders.list');
});

test('no crea acciones para clientes ni shadow', () => {
  assert.equal(
    resolveControlledConnectReadAction(context({
      metadata: {
        mode: 'active',
        ownerMode: false,
        permissions: ['connect:quotes:read']
      }
    })),
    null
  );
  assert.equal(
    resolveControlledConnectReadAction(context({
      metadata: {
        mode: 'shadow',
        ownerMode: true,
        permissions: ['connect:quotes:read']
      }
    })),
    null
  );
});

test('bloquea escrituras aunque exista permiso de lectura', () => {
  assert.equal(
    resolveControlledConnectReadAction(context({
      message: 'Creá una cotización nueva'
    })),
    null
  );
});

test('requiere el permiso específico de la operación', () => {
  assert.equal(
    resolveControlledConnectReadAction(context({
      message: 'Mostrame los clientes'
    })),
    null
  );
});

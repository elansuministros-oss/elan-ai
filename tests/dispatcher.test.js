import assert from 'node:assert/strict';
import test from 'node:test';
import { Dispatcher } from '../src/dispatcher/index.js';

test('Dispatcher genera contexto normalizado', () => {
  const dispatcher = new Dispatcher();
  const context = dispatcher.dispatch({
    channel: 'WhatsApp',
    externalUserId: '50588888888',
    message: ' Necesito una cotización ',
    metadata: { source: 'test' }
  });

  assert.equal(context.channel, 'whatsapp');
  assert.equal(context.externalUserId, '50588888888');
  assert.equal(context.message, 'Necesito una cotización');
  assert.equal(context.status, 'RECEIVED');
  assert.equal(context.metadata.source, 'test');
  assert.ok(context.requestId);
  assert.ok(context.receivedAt);
});

test('Dispatcher rechaza canales desconocidos', () => {
  const dispatcher = new Dispatcher();

  assert.throws(
    () => dispatcher.dispatch({ channel: 'desconocido', message: 'Hola' }),
    /Canal no soportado/
  );
});

test('Dispatcher rechaza mensajes vacíos', () => {
  const dispatcher = new Dispatcher();

  assert.throws(
    () => dispatcher.dispatch({ channel: 'web', message: '   ' }),
    /message debe ser un texto no vacío/
  );
});

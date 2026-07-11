import assert from 'node:assert/strict';
import test from 'node:test';
import {
  BaseChannel,
  ChannelEngine,
  ChannelRegistry,
  InternalChannel,
  WhatsAppChannel,
  createDefaultChannelRegistry
} from '../src/channels/index.js';

test('ChannelEngine normaliza entrada WhatsApp', () => {
  const registry = createDefaultChannelRegistry();
  const engine = new ChannelEngine(registry);

  const result = engine.normalize('whatsapp', {
    from: '50588888888',
    body: ' Necesito cotizacion ',
    messageId: 'wamid-001'
  });

  assert.equal(result.channel, 'whatsapp');
  assert.equal(result.externalUserId, '50588888888');
  assert.equal(result.message, 'Necesito cotizacion');
  assert.equal(result.metadata.rawMessageId, 'wamid-001');
});

test('ChannelEngine formatea respuesta WhatsApp', () => {
  const registry = createDefaultChannelRegistry();
  const engine = new ChannelEngine(registry);

  const result = engine.formatResponse('whatsapp', {
    externalUserId: '50588888888',
    response: 'Cotizacion recibida'
  });

  assert.equal(result.channel, 'whatsapp');
  assert.equal(result.recipient, '50588888888');
  assert.equal(result.message, 'Cotizacion recibida');
});

test('Registry por defecto contiene internal y whatsapp', () => {
  const registry = createDefaultChannelRegistry();

  assert.deepEqual(registry.list(), ['internal', 'whatsapp']);
});

test('ChannelRegistry rechaza duplicados', () => {
  const registry = new ChannelRegistry();
  registry.register(new InternalChannel());

  assert.throws(
    () => registry.register(new InternalChannel()),
    /Channel duplicado/
  );
});

test('ChannelEngine rechaza channel inexistente', () => {
  const engine = new ChannelEngine(new ChannelRegistry());

  assert.throws(
    () => engine.normalize('missing', { message: 'Hola' }),
    /Channel no registrado/
  );
});

test('BaseChannel exige implementacion concreta', () => {
  const channel = new BaseChannel('base');

  assert.throws(
    () => channel.normalize({}),
    /debe implementar normalize/
  );

  assert.throws(
    () => channel.formatResponse({}),
    /debe implementar formatResponse/
  );
});

test('WhatsAppChannel rechaza mensaje vacio mediante ChannelEngine', () => {
  const registry = new ChannelRegistry()
    .register(new WhatsAppChannel());

  const engine = new ChannelEngine(registry);

  assert.throws(
    () => engine.normalize('whatsapp', { from: '50588888888' }),
    /mensaje invalido/
  );
});
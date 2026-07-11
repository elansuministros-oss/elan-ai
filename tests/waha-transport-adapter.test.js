import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createWahaTransportAdapter,
  WahaSendTextTool,
  WahaTransportAdapter
} from '../src/adapters/waha/index.js';
import {
  loadWahaConfig
} from '../src/config/wahaConfig.js';

test('WAHA config exige URL y API key', () => {
  assert.throws(
    () => loadWahaConfig({}),
    /WAHA_BASE_URL requerido/
  );

  assert.throws(
    () => loadWahaConfig({
      WAHA_BASE_URL: 'https://waha.example.com'
    }),
    /WAHA_API_KEY requerido/
  );
});

test('WAHA adapter envia texto con contrato oficial', async () => {
  const calls = [];

  const adapter = new WahaTransportAdapter({
    baseUrl: 'https://waha.example.com/',
    apiKey: 'test-key',
    session: 'default',
    async fetchImpl(url, options) {
      calls.push({ url, options });

      return {
        ok: true,
        status: 200,
        async json() {
          return {
            id: 'message-001'
          };
        }
      };
    }
  });

  const result = await adapter.sendText({
    chatId: '50588888888',
    text: 'Hola'
  });

  assert.equal(result.status, 'SENT');
  assert.equal(result.chatId, '50588888888@c.us');
  assert.equal(calls[0].url, 'https://waha.example.com/api/sendText');
  assert.equal(calls[0].options.headers['X-Api-Key'], 'test-key');

  const body = JSON.parse(calls[0].options.body);

  assert.equal(body.session, 'default');
  assert.equal(body.chatId, '50588888888@c.us');
  assert.equal(body.text, 'Hola');
});

test('WAHA adapter conserva chatId completo', async () => {
  let sentBody;

  const adapter = new WahaTransportAdapter({
    baseUrl: 'https://waha.example.com',
    apiKey: 'test-key',
    session: 'work',
    async fetchImpl(url, options) {
      sentBody = JSON.parse(options.body);

      return {
        ok: true,
        status: 200,
        async json() {
          return {};
        }
      };
    }
  });

  await adapter.sendText({
    chatId: '50577777777@c.us',
    text: 'Mensaje'
  });

  assert.equal(sentBody.chatId, '50577777777@c.us');
  assert.equal(sentBody.session, 'work');
});

test('WAHA adapter reporta errores HTTP', async () => {
  const adapter = new WahaTransportAdapter({
    baseUrl: 'https://waha.example.com',
    apiKey: 'test-key',
    async fetchImpl() {
      return {
        ok: false,
        status: 401,
        async json() {
          return {
            message: 'Unauthorized'
          };
        }
      };
    }
  });

  await assert.rejects(
    () => adapter.sendText({
      chatId: '50588888888',
      text: 'Hola'
    }),
    /WAHA sendText 401/
  );
});

test('WAHA Tool delega envio al adapter', async () => {
  const calls = [];

  const tool = new WahaSendTextTool({
    async sendText(input) {
      calls.push(input);

      return {
        status: 'SENT',
        chatId: '50588888888@c.us',
        data: {}
      };
    }
  });

  const result = await tool.execute({
    chatId: '50588888888',
    text: 'Hola'
  });

  assert.equal(result.status, 'SENT');
  assert.equal(calls.length, 1);
});

test('Factory WAHA permite fetch inyectado', () => {
  const adapter = createWahaTransportAdapter({
    env: {
      WAHA_BASE_URL: 'https://waha.example.com',
      WAHA_API_KEY: 'test-key',
      WAHA_SESSION: 'default'
    },
    fetchImpl: async () => ({})
  });

  assert.equal(adapter.session, 'default');
});
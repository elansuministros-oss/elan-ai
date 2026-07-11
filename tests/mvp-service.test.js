import assert from 'node:assert/strict';
import test from 'node:test';
import { ElanAIMvpService } from '../src/application/index.js';

test('MVP procesa mensaje sin enviar por defecto', async () => {
  const calls = [];

  const service = new ElanAIMvpService({
    runtime: {
      async process(channel, payload) {
        calls.push({ channel, payload });
        return {
          status: 'COMPLETED',
          response: {
            recipient: '50588888888',
            message: 'Hola'
          }
        };
      }
    },
    wahaAdapter: {
      async sendText() {
        throw new Error('No debe enviar');
      }
    }
  });

  const result = await service.handleIncoming('whatsapp', {
    body: 'Hola'
  });

  assert.equal(result.status, 'COMPLETED');
  assert.equal(calls.length, 1);
});

test('MVP envia por WAHA solo con send=true', async () => {
  const sent = [];

  const service = new ElanAIMvpService({
    runtime: {
      async process() {
        return {
          status: 'COMPLETED',
          response: {
            recipient: '50588888888',
            message: 'Respuesta'
          }
        };
      }
    },
    wahaAdapter: {
      async sendText(input) {
        sent.push(input);
      }
    }
  });

  await service.handleIncoming(
    'whatsapp',
    { body: 'Hola' },
    { send: true }
  );

  assert.equal(sent.length, 1);
  assert.equal(sent[0].text, 'Respuesta');
});
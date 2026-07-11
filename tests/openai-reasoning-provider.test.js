import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createOpenAIReasoningProvider,
  OpenAIReasoningProvider
} from '../src/reasoning/index.js';
import {
  loadOpenAIConfig
} from '../src/config/openAIConfig.js';

test('OpenAI config exige API key', () => {
  assert.throws(
    () => loadOpenAIConfig({}),
    /OPENAI_API_KEY requerido/
  );
});

test('OpenAIReasoningProvider usa Responses API', async () => {
  const calls = [];

  const client = {
    responses: {
      async create(payload) {
        calls.push(payload);

        return {
          id: 'resp_test_001',
          output_text: 'Razonamiento comercial listo',
          usage: {
            input_tokens: 12,
            output_tokens: 5
          }
        };
      }
    }
  };

  const provider = new OpenAIReasoningProvider({
    client,
    model: 'gpt-test'
  });

  const result = await provider.generate({
    requestId: 'req-001',
    message: 'Necesito precio',
    intent: 'quote',
    operator: 'sales'
  });

  assert.equal(result.provider, 'openai');
  assert.equal(result.text, 'Razonamiento comercial listo');
  assert.equal(result.usage.inputTokens, 12);
  assert.equal(result.usage.outputTokens, 5);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].model, 'gpt-test');
});

test('OpenAIReasoningProvider rechaza respuesta vacia', async () => {
  const provider = new OpenAIReasoningProvider({
    client: {
      responses: {
        async create() {
          return { output_text: '' };
        }
      }
    },
    model: 'gpt-test'
  });

  await assert.rejects(
    () => provider.generate({ message: 'Hola' }),
    /respuesta vacia/
  );
});

test('Factory OpenAI permite cliente inyectado', () => {
  const calls = [];

  const provider = createOpenAIReasoningProvider({
    env: {
      OPENAI_API_KEY: 'test-key',
      OPENAI_MODEL: 'gpt-test'
    },
    clientFactory(options) {
      calls.push(options);

      return {
        responses: {
          async create() {
            return {
              output_text: 'OK'
            };
          }
        }
      };
    }
  });

  assert.equal(provider.model, 'gpt-test');
  assert.equal(calls.length, 1);
  assert.equal(calls[0].apiKey, 'test-key');
});
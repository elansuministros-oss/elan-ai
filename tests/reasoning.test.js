import assert from 'node:assert/strict';
import test from 'node:test';
import {
  DeterministicReasoningProvider,
  ReasoningEngine
} from '../src/reasoning/index.js';

test('Reasoning ejecuta un provider desacoplado', async () => {
  const engine = new ReasoningEngine(
    new DeterministicReasoningProvider()
  );

  const result = await engine.reason({
    context: {
      requestId: 'req-001',
      channel: 'whatsapp',
      message: 'Necesito precio para un rotulo'
    },
    plan: {
      requestId: 'req-001',
      intent: 'quote',
      selectedOperator: 'sales'
    },
    memory: {
      summary: 'Cliente consulto por rotulos'
    },
    knowledge: [
      {
        id: 'emc-001',
        title: 'PVC 3 mm'
      }
    ]
  });

  assert.equal(result.requestId, 'req-001');
  assert.equal(result.intent, 'quote');
  assert.equal(result.selectedOperator, 'sales');
  assert.equal(result.provider, 'deterministic');
  assert.equal(result.status, 'REASONED');
  assert.match(result.text, /Necesito precio para un rotulo/);
});

test('Reasoning permite sustituir el provider', async () => {
  const customProvider = {
    async generate(input) {
      return {
        provider: 'custom-test',
        text: `Operador: ${input.operator}`,
        usage: {
          inputTokens: 10,
          outputTokens: 4
        }
      };
    }
  };

  const engine = new ReasoningEngine(customProvider);

  const result = await engine.reason({
    context: {
      message: 'Hola'
    },
    plan: {
      requestId: 'req-002',
      intent: 'general',
      selectedOperator: 'general'
    }
  });

  assert.equal(result.provider, 'custom-test');
  assert.equal(result.text, 'Operador: general');
  assert.equal(result.usage.inputTokens, 10);
  assert.equal(result.usage.outputTokens, 4);
});

test('Reasoning rechaza providers invalidos', () => {
  assert.throws(
    () => new ReasoningEngine({}),
    /provider con generate/
  );
});

test('Reasoning rechaza planes incompletos', async () => {
  const engine = new ReasoningEngine(
    new DeterministicReasoningProvider()
  );

  await assert.rejects(
    () => engine.reason({
      context: {
        message: 'Hola'
      },
      plan: {
        requestId: 'req-003',
        intent: 'general'
      }
    }),
    /selectedOperator/
  );
});
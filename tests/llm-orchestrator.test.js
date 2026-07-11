import assert from 'node:assert/strict';
import test from 'node:test';
import { LLMOrchestrator } from '../src/llm/index.js';

test('LLMOrchestrator omite LLM en saludo sin contexto', async () => {
  const orchestrator = new LLMOrchestrator({
    async reason() {
      throw new Error('No debe ejecutarse');
    }
  });

  const result = await orchestrator.execute({
    plan: { intent: 'general' },
    knowledge: [],
    conversation: { turnCount: 0 }
  });

  assert.equal(result.skipped, true);
});

test('LLMOrchestrator usa razonamiento en cotizacion', async () => {
  const orchestrator = new LLMOrchestrator({
    async reason() {
      return {
        requestId: 'r1',
        text: 'Analisis',
        provider: 'test'
      };
    }
  });

  const result = await orchestrator.execute({
    plan: { intent: 'quote' }
  });

  assert.equal(result.skipped, false);
  assert.equal(result.text, 'Analisis');
});
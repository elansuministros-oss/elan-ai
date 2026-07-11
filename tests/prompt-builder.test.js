import assert from 'node:assert/strict';
import test from 'node:test';
import { PromptBuilder } from '../src/prompt/index.js';

test('PromptBuilder construye prompt compacto', () => {
  const builder = new PromptBuilder();

  const result = builder.build({
    context: { plan: { intent: 'quote' } },
    rules: ['Máximo una pregunta por respuesta.']
  });

  assert.match(result.system, /No inventes precios/);
  assert.match(result.system, /Máximo una pregunta/);
  assert.match(result.input, /quote/);
});
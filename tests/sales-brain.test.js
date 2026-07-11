import assert from 'node:assert/strict';
import test from 'node:test';
import { SalesBrain } from '../src/sales/index.js';

test('SalesBrain pasa a cotizacion cuando detecta precio', () => {
  const brain = new SalesBrain();

  const result = brain.evaluate({
    context: { message: 'Necesito precio de un rotulo' },
    knowledge: [{ id: 'price-1' }]
  });

  assert.equal(result.stage, 'QUOTING');
  assert.equal(result.shouldMentionPrice, true);
  assert.equal(result.nextQuestion, null);
});
import assert from 'node:assert/strict';
import test from 'node:test';
import { MemoryConsolidator } from '../src/memory/index.js';

test('MemoryConsolidator limita memoria corta', () => {
  const consolidator = new MemoryConsolidator({
    maxMessages: 3,
    summaryMessages: 2
  });

  const session = {
    messages: [
      { role: 'user', content: 'A' },
      { role: 'assistant', content: 'B' },
      { role: 'user', content: 'C' },
      { role: 'assistant', content: 'D' }
    ]
  };

  const result = consolidator.consolidate(session);

  assert.equal(result.shortTerm.length, 3);
  assert.match(result.longTermSummary, /C/);
  assert.match(result.longTermSummary, /D/);
});
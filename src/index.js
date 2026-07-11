import { createDefaultElanAIRuntime } from './core/index.js';

const runtime = createDefaultElanAIRuntime();

const result = await runtime.process('internal', {
  externalUserId: 'system',
  message: 'health-check',
  metadata: {
    movement: 'AI-011'
  }
});

console.clear();
console.log('====================================');
console.log('ELAN AI');
console.log('Estado       : ONLINE');
console.log('Movimiento   : AI-011');
console.log('Runtime      : READY');
console.log('Request ID   : ' + result.requestId);
console.log('Status       : ' + result.status);
console.log('====================================');
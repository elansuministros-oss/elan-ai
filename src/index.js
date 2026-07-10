import { dispatcher } from './dispatcher/index.js';

const validationContext = dispatcher.dispatch({
  channel: 'internal',
  externalUserId: 'system',
  message: 'health-check',
  metadata: { movement: 'AI-002' }
});

console.clear();
console.log('====================================');
console.log('ELAN AI');
console.log('Estado       : ONLINE');
console.log('Movimiento   : AI-002');
console.log('Dispatcher   : READY');
console.log(`Request ID   : ${validationContext.requestId}`);
console.log('====================================');

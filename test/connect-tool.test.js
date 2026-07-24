import test from 'node:test';
import assert from 'node:assert/strict';
import { ConnectTool } from '../src/tools/connectTool.js';
import { createDefaultToolRegistry } from '../src/tools/createDefaultToolRegistry.js';

function fakeClient() {
  const calls = [];
  return {
    calls,
    async getHealth() {
      return { status: 'OK' };
    },
    async executeConnectTool(input) {
      calls.push(input);
      return {
        success: true,
        result: {
          operation: input.operation,
          data: [{ id: 'lead-1' }]
        }
      };
    }
  };
}

test('ConnectTool delega en Orchestrator y conserva permisos y modo', async () => {
  const client = fakeClient();
  const tool = new ConnectTool(client);
  const result = await tool.execute({
    operation: 'leads.list',
    input: { status: 'new' },
    permissions: ['connect:leads:read'],
    mode: 'active'
  });

  assert.equal(result.status, 'SUCCESS');
  assert.deepEqual(result.data.result, [{ id: 'lead-1' }]);
  assert.deepEqual(client.calls[0], {
    operation: 'leads.list',
    input: { status: 'new' },
    permissions: ['connect:leads:read'],
    mode: 'active'
  });
});

test('registry por defecto registra la herramienta connect', async () => {
  const client = fakeClient();
  const registry = createDefaultToolRegistry({ orchestratorClient: client });
  const result = await registry.execute('connect', {
    operation: 'orders.list',
    permissions: ['connect:orders:read'],
    mode: 'active'
  });

  assert.equal(result.status, 'SUCCESS');
  assert.equal(client.calls[0].operation, 'orders.list');
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { OrchestratorTool } from '../src/tools/orchestratorTool.js';
import { createDefaultToolRegistry } from '../src/tools/createDefaultToolRegistry.js';

function fakeClient() {
  return {
    async getHealth() { return { status: 'OK' }; },
    async getDashboard() { return { summary: { status: 'OK' } }; },
    async getProjects() { return { count: 7 }; },
    async getEcosystem() { return { healthy: true }; },
    async getGithub() { return { healthy: true }; },
    async getDocker() { return { running: 3 }; }
  };
}

test('OrchestratorTool consulta una operación permitida', async () => {
  const tool = new OrchestratorTool(fakeClient());
  const result = await tool.execute({ operation: 'projects' });

  assert.equal(result.status, 'SUCCESS');
  assert.equal(result.data.operation, 'projects');
  assert.equal(result.data.result.count, 7);
});

test('OrchestratorTool rechaza operaciones desconocidas', async () => {
  const tool = new OrchestratorTool(fakeClient());

  await assert.rejects(
    () => tool.execute({ operation: 'delete_everything' }),
    /ORCHESTRATOR_OPERATION_INVALID/
  );
});

test('registry por defecto registra la herramienta orchestrator', async () => {
  const registry = createDefaultToolRegistry({ orchestratorClient: fakeClient() });
  const result = await registry.execute('orchestrator', { operation: 'health' });

  assert.equal(result.data.result.status, 'OK');
});

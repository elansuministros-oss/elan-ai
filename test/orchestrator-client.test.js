import test from 'node:test';
import assert from 'node:assert/strict';
import { OrchestratorClient } from '../src/adapters/orchestratorClient.js';

function response(data, { ok = true, status = 200 } = {}) {
  return {
    ok,
    status,
    async json() { return data; }
  };
}

test('OrchestratorClient consulta dashboard en la URL configurada', async () => {
  const calls = [];
  const client = new OrchestratorClient({
    baseUrl: 'http://orchestrator.test/',
    fetchImpl: async (url, options) => {
      calls.push({ url, options });
      return response({ summary: { status: 'OK' } });
    }
  });

  const result = await client.getDashboard();

  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'http://orchestrator.test/api/dashboard');
  assert.equal(calls[0].options.method, 'GET');
  assert.equal(result.summary.status, 'OK');
});

test('OrchestratorClient rechaza respuestas HTTP no exitosas', async () => {
  const client = new OrchestratorClient({
    fetchImpl: async () => response({ error: 'fallo' }, { ok: false, status: 503 })
  });

  await assert.rejects(
    () => client.getHealth(),
    error => error.message === 'ORCHESTRATOR_HTTP_503' && error.status === 503
  );
});

test('OrchestratorClient ejecuta CONNECT Tool Gateway autenticado', async () => {
  const calls = [];
  const client = new OrchestratorClient({
    baseUrl: 'http://orchestrator.test/',
    internalToken: 'secret',
    fetchImpl: async (url, options) => {
      calls.push({ url, options });
      return response({
        success: true,
        result: { operation: 'leads.list', data: [] }
      });
    }
  });

  const result = await client.executeConnectTool({
    operation: 'leads.list',
    input: {},
    permissions: ['connect:leads:read'],
    mode: 'active'
  });

  assert.equal(result.success, true);
  assert.equal(calls[0].url, 'http://orchestrator.test/api/tools/connect');
  assert.equal(calls[0].options.method, 'POST');
  assert.equal(calls[0].options.headers['X-ELAN-AI-Token'], 'secret');
});

import { createOrchestratorClient } from '../adapters/orchestratorClient.js';
import { BaseTool } from './baseTool.js';

const OPERATIONS = Object.freeze({
  health: 'getHealth',
  dashboard: 'getDashboard',
  projects: 'getProjects',
  ecosystem: 'getEcosystem',
  github: 'getGithub',
  docker: 'getDocker'
});

export class OrchestratorTool extends BaseTool {
  constructor(client = createOrchestratorClient()) {
    super('orchestrator');

    if (!client || typeof client.getHealth !== 'function') {
      throw new TypeError('OrchestratorTool requiere un cliente valido');
    }

    this.client = client;
  }

  async execute(input = {}) {
    const operation = String(input.operation || 'dashboard').trim().toLowerCase();
    const method = OPERATIONS[operation];

    if (!method) {
      throw new Error(`ORCHESTRATOR_OPERATION_INVALID:${operation}`);
    }

    const data = await this.client[method]();

    return Object.freeze({
      status: 'SUCCESS',
      data: Object.freeze({ operation, result: data })
    });
  }
}

export { OPERATIONS as ORCHESTRATOR_OPERATIONS };

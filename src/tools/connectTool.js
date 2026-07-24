import { createOrchestratorClient } from '../adapters/orchestratorClient.js';
import { BaseTool } from './baseTool.js';

export class ConnectTool extends BaseTool {
  constructor(client = createOrchestratorClient()) {
    super('connect');

    if (!client || typeof client.executeConnectTool !== 'function') {
      throw new TypeError('ConnectTool requiere cliente Orchestrator');
    }
    this.client = client;
  }

  async execute(input = {}) {
    const operation = String(input.operation || '').trim().toLowerCase();
    if (!operation) {
      throw new TypeError('CONNECT_OPERATION_REQUIRED');
    }

    const response = await this.client.executeConnectTool({
      operation,
      input:
        input.input &&
        typeof input.input === 'object' &&
        !Array.isArray(input.input)
          ? input.input
          : {},
      permissions: Array.isArray(input.permissions)
        ? input.permissions
        : [],
      mode: String(input.mode || 'shadow').trim().toLowerCase()
    });

    if (!response?.success || !response.result) {
      throw new Error('CONNECT_GATEWAY_RESPONSE_INVALID');
    }

    return Object.freeze({
      status: 'SUCCESS',
      data: Object.freeze({
        operation,
        result: response.result.data
      })
    });
  }
}

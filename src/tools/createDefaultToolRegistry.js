import { EchoTool } from './echoTool.js';
import { OrchestratorTool } from './orchestratorTool.js';
import { ToolRegistry } from './toolRegistry.js';

export function createDefaultToolRegistry({ orchestratorClient } = {}) {
  return new ToolRegistry()
    .register(new EchoTool())
    .register(new OrchestratorTool(orchestratorClient));
}

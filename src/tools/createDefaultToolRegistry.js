import { EchoTool } from './echoTool.js';
import { ConnectTool } from './connectTool.js';
import { OrchestratorTool } from './orchestratorTool.js';
import { ToolRegistry } from './toolRegistry.js';

export function createDefaultToolRegistry({ orchestratorClient } = {}) {
  const connectClient =
    typeof orchestratorClient?.executeConnectTool === 'function'
      ? orchestratorClient
      : undefined;

  return new ToolRegistry()
    .register(new EchoTool())
    .register(new OrchestratorTool(orchestratorClient))
    .register(new ConnectTool(connectClient));
}

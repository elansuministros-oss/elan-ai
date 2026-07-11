import { EchoTool } from './echoTool.js';
import { ToolRegistry } from './toolRegistry.js';

export function createDefaultToolRegistry() {
  return new ToolRegistry()
    .register(new EchoTool());
}
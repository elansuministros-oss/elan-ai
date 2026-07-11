import assert from 'node:assert/strict';
import test from 'node:test';
import {
  BaseTool,
  EchoTool,
  ToolEngine,
  ToolRegistry,
  createDefaultToolRegistry
} from '../src/tools/index.js';

test('ToolEngine ejecuta tool registrada', async () => {
  const registry = createDefaultToolRegistry();
  const engine = new ToolEngine(registry);

  const result = await engine.run({
    toolName: 'echo',
    requestId: 'req-001',
    input: {
      message: 'Hola'
    }
  });

  assert.equal(result.requestId, 'req-001');
  assert.equal(result.toolName, 'echo');
  assert.equal(result.status, 'SUCCESS');
  assert.equal(result.data.message, 'Hola');
});

test('ToolRegistry rechaza duplicados', () => {
  const registry = new ToolRegistry();
  registry.register(new EchoTool());

  assert.throws(
    () => registry.register(new EchoTool()),
    /Tool duplicada/
  );
});

test('ToolEngine rechaza tools desconocidas', async () => {
  const registry = new ToolRegistry();
  const engine = new ToolEngine(registry);

  await assert.rejects(
    () => engine.run({
      toolName: 'missing'
    }),
    /Tool no registrada/
  );
});

test('BaseTool exige implementacion concreta', async () => {
  const tool = new BaseTool('base');

  await assert.rejects(
    () => tool.execute(),
    /debe implementar execute/
  );
});
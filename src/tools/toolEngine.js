export class ToolEngine {
  constructor(registry) {
    if (!registry || typeof registry.execute !== 'function') {
      throw new TypeError('ToolEngine requiere un registry valido');
    }

    this.registry = registry;
  }

  async run({ toolName, input = {}, requestId = null } = {}) {
    if (typeof toolName !== 'string' || toolName.trim() === '') {
      throw new TypeError('ToolEngine requiere toolName');
    }

    const startedAt = new Date().toISOString();
    const result = await this.registry.execute(toolName.trim(), input);

    return Object.freeze({
      requestId,
      toolName: toolName.trim(),
      status: result.status ?? 'SUCCESS',
      data: Object.freeze({ ...(result.data || {}) }),
      startedAt,
      completedAt: new Date().toISOString()
    });
  }
}
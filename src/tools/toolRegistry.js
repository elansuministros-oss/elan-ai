export class ToolRegistry {
  #tools = new Map();

  register(tool) {
    if (
      !tool ||
      typeof tool.name !== 'string' ||
      typeof tool.execute !== 'function'
    ) {
      throw new TypeError('Tool invalida');
    }

    if (this.#tools.has(tool.name)) {
      throw new Error(`Tool duplicada: ${tool.name}`);
    }

    this.#tools.set(tool.name, tool);
    return this;
  }

  has(name) {
    return this.#tools.has(name);
  }

  get(name) {
    return this.#tools.get(name) ?? null;
  }

  list() {
    return Array.from(this.#tools.keys());
  }

  async execute(name, input = {}) {
    const tool = this.get(name);

    if (!tool) {
      throw new Error(`Tool no registrada: ${name}`);
    }

    const result = await tool.execute(input);

    if (!result || typeof result !== 'object') {
      throw new TypeError(`Resultado invalido de Tool: ${name}`);
    }

    return Object.freeze({
      tool: name,
      ...result
    });
  }
}
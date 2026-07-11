export class BaseTool {
  constructor(name) {
    if (typeof name !== 'string' || name.trim() === '') {
      throw new TypeError('Tool requiere un nombre valido');
    }

    this.name = name.trim();
  }

  async execute() {
    throw new Error(`Tool ${this.name} debe implementar execute()`);
  }
}
export class BaseOperator {
  constructor(name) {
    if (typeof name !== 'string' || name.trim() === '') {
      throw new TypeError('Operator requiere un nombre valido');
    }

    this.name = name.trim();
  }

  async execute() {
    throw new Error(`Operator ${this.name} debe implementar execute()`);
  }
}
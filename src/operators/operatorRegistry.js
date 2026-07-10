export class OperatorRegistry {
  #operators = new Map();

  register(operator) {
    if (
      !operator ||
      typeof operator.name !== 'string' ||
      typeof operator.execute !== 'function'
    ) {
      throw new TypeError('Operator invalido');
    }

    if (this.#operators.has(operator.name)) {
      throw new Error(`Operator duplicado: ${operator.name}`);
    }

    this.#operators.set(operator.name, operator);
    return this;
  }

  has(name) {
    return this.#operators.has(name);
  }

  get(name) {
    return this.#operators.get(name) ?? null;
  }

  async execute(name, payload) {
    const operator = this.get(name);

    if (!operator) {
      throw new Error(`Operator no registrado: ${name}`);
    }

    return operator.execute(payload);
  }

  list() {
    return Array.from(this.#operators.keys());
  }
}
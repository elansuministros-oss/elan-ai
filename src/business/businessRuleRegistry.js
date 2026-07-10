export class BusinessRuleRegistry {
  #rules = new Map();

  register(rule) {
    if (
      !rule ||
      typeof rule.id !== 'string' ||
      typeof rule.evaluate !== 'function'
    ) {
      throw new TypeError('BusinessRule invalida');
    }

    if (this.#rules.has(rule.id)) {
      throw new Error(`BusinessRule duplicada: ${rule.id}`);
    }

    this.#rules.set(rule.id, rule);
    return this;
  }

  get(id) {
    return this.#rules.get(id) ?? null;
  }

  list() {
    return Array.from(this.#rules.values());
  }
}
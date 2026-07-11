export class InMemoryStateAdapter {
  #states = new Map();

  save(key, value) {
    this.#states.set(key, structuredClone(value));
    return structuredClone(value);
  }

  get(key) {
    const value = this.#states.get(key);
    return value ? structuredClone(value) : null;
  }

  delete(key) {
    return this.#states.delete(key);
  }

  list() {
    return Array.from(
      this.#states.entries(),
      ([key, value]) => ({
        key,
        value: structuredClone(value)
      })
    );
  }
}
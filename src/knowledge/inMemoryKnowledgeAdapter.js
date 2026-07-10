export class InMemoryKnowledgeAdapter {
  #records = new Map();

  save(record) {
    this.#records.set(record.id, structuredClone(record));
    return structuredClone(record);
  }

  getById(id) {
    const record = this.#records.get(id);
    return record ? structuredClone(record) : null;
  }

  list() {
    return Array.from(this.#records.values(), (record) => structuredClone(record));
  }
}
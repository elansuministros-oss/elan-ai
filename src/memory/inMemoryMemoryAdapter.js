export class InMemoryMemoryAdapter {
  #sessions = new Map();

  save(session) {
    const stored = structuredClone(session);
    this.#sessions.set(stored.sessionId, stored);
    return structuredClone(stored);
  }

  get(sessionId) {
    const session = this.#sessions.get(sessionId);
    return session ? structuredClone(session) : null;
  }

  delete(sessionId) {
    return this.#sessions.delete(sessionId);
  }

  list() {
    return Array.from(
      this.#sessions.values(),
      (session) => structuredClone(session)
    );
  }
}
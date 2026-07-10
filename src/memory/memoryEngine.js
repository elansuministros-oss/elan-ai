export class MemoryEngine {
  #sessions = new Map();

  createSession(sessionId) {
    if (!sessionId) throw new TypeError('sessionId requerido');
    if (!this.#sessions.has(sessionId)) {
      this.#sessions.set(sessionId, {
        sessionId,
        messages: [],
        summary: '',
        updatedAt: new Date().toISOString()
      });
    }
    return this.#sessions.get(sessionId);
  }

  appendMessage(sessionId, role, content) {
    const session = this.createSession(sessionId);
    session.messages.push({
      role,
      content,
      at: new Date().toISOString()
    });
    session.updatedAt = new Date().toISOString();
    session.summary = session.messages
      .slice(-5)
      .map(m => `[${m.role}] ${m.content}`)
      .join(' | ');
    return session;
  }

  getSession(sessionId) {
    return this.#sessions.get(sessionId) ?? null;
  }
}

export const memoryEngine = new MemoryEngine();
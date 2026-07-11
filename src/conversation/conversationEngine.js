export class ConversationEngine {
  constructor(memoryEngine) {
    if (!memoryEngine || typeof memoryEngine.getSession !== 'function') {
      throw new TypeError('ConversationEngine requiere MemoryEngine');
    }
    this.memoryEngine = memoryEngine;
  }

  async build(identityId, { limit = 12 } = {}) {
    const session = await this.memoryEngine.getSession(identityId);

    if (!session) {
      return Object.freeze({
        identityId,
        messages: Object.freeze([]),
        summary: '',
        turnCount: 0
      });
    }

    const messages = session.messages.slice(-limit).map((message) =>
      Object.freeze({ ...message })
    );

    return Object.freeze({
      identityId,
      messages: Object.freeze(messages),
      summary: session.summary ?? '',
      turnCount: session.messages.length
    });
  }

  async append(identityId, role, content) {
    return this.memoryEngine.appendMessage(identityId, role, content);
  }
}
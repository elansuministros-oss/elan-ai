function requireText(value, fieldName) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new TypeError(`${fieldName} requerido`);
  }

  return value.trim();
}

function validateAdapter(adapter) {
  if (
    !adapter ||
    typeof adapter.save !== 'function' ||
    typeof adapter.get !== 'function' ||
    typeof adapter.list !== 'function'
  ) {
    throw new TypeError('MemoryEngine requiere un adapter valido');
  }
}

export class MemoryEngine {
  constructor(adapter) {
    validateAdapter(adapter);
    this.adapter = adapter;
  }

  async createSession(sessionId) {
    const normalizedSessionId = requireText(sessionId, 'sessionId');
    const existing = await this.adapter.get(normalizedSessionId);

    if (existing) {
      return existing;
    }

    const session = {
      sessionId: normalizedSessionId,
      messages: [],
      summary: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return this.adapter.save(session);
  }

  async appendMessage(sessionId, role, content) {
    const normalizedRole = requireText(role, 'role');
    const normalizedContent = requireText(content, 'content');

    const session = await this.createSession(sessionId);

    const next = {
      ...session,
      messages: [
        ...session.messages,
        {
          role: normalizedRole,
          content: normalizedContent,
          at: new Date().toISOString()
        }
      ],
      updatedAt: new Date().toISOString()
    };

    next.summary = next.messages
      .slice(-5)
      .map((message) => `[${message.role}] ${message.content}`)
      .join(' | ');

    return this.adapter.save(next);
  }

  async getSession(sessionId) {
    return this.adapter.get(requireText(sessionId, 'sessionId'));
  }

  async deleteSession(sessionId) {
    return this.adapter.delete(requireText(sessionId, 'sessionId'));
  }

  async listSessions() {
    return this.adapter.list();
  }
}
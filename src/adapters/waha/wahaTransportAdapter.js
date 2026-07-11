function requireText(value, fieldName) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new TypeError(`${fieldName} requerido`);
  }

  return value.trim();
}

function normalizeChatId(value) {
  const raw = requireText(value, 'chatId');

  if (raw.includes('@')) {
    return raw;
  }

  const digits = raw.replace(/\D+/g, '');

  if (!digits) {
    throw new TypeError('chatId invalido');
  }

  return `${digits}@c.us`;
}

export class WahaTransportAdapter {
  constructor({
    baseUrl,
    apiKey,
    session = 'default',
    fetchImpl = globalThis.fetch
  }) {
    this.baseUrl = requireText(baseUrl, 'baseUrl').replace(/\/+$/, '');
    this.apiKey = requireText(apiKey, 'apiKey');
    this.session = requireText(session, 'session');

    if (typeof fetchImpl !== 'function') {
      throw new TypeError('WahaTransportAdapter requiere fetch');
    }

    this.fetchImpl = fetchImpl;
  }

  async sendText({
    chatId,
    text,
    replyTo = null
  } = {}) {
    const body = {
      session: this.session,
      chatId: normalizeChatId(chatId),
      text: requireText(text, 'text')
    };

    if (replyTo) {
      body.reply_to = requireText(replyTo, 'replyTo');
    }

    const response = await this.fetchImpl(
      `${this.baseUrl}/api/sendText`,
      {
        method: 'POST',
        headers: {
          'X-Api-Key': this.apiKey,
          Accept: 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      }
    );

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        `WAHA sendText ${response.status}: ` +
        `${payload.message || payload.error || 'Error desconocido'}`
      );
    }

    return Object.freeze({
      status: 'SENT',
      chatId: body.chatId,
      session: this.session,
      data: Object.freeze({ ...payload })
    });
  }
}
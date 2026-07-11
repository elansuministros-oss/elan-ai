import { BaseChannel } from './baseChannel.js';

export class WhatsAppChannel extends BaseChannel {
  constructor() {
    super('whatsapp');
  }

  normalize(input = {}) {
    const externalUserId = String(
      input.externalUserId ??
      input.from ??
      input.chatId ??
      ''
    ).trim();

    const message = String(
      input.message ??
      input.body ??
      input.text ??
      ''
    ).trim();

    return Object.freeze({
      channel: this.name,
      externalUserId,
      message,
      metadata: Object.freeze({
        ...(input.metadata || {}),
        rawMessageId: input.messageId ?? null
      })
    });
  }

  formatResponse(output = {}) {
    return Object.freeze({
      channel: this.name,
      recipient: String(
        output.externalUserId ??
        output.to ??
        ''
      ).trim(),
      message: String(
        output.message ??
        output.response ??
        ''
      ).trim(),
      metadata: Object.freeze({ ...(output.metadata || {}) })
    });
  }
}
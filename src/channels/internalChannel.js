import { BaseChannel } from './baseChannel.js';

export class InternalChannel extends BaseChannel {
  constructor() {
    super('internal');
  }

  normalize(input = {}) {
    return Object.freeze({
      channel: this.name,
      externalUserId: input.externalUserId ?? 'system',
      message: String(input.message || '').trim(),
      metadata: Object.freeze({ ...(input.metadata || {}) })
    });
  }

  formatResponse(output = {}) {
    return Object.freeze({
      channel: this.name,
      recipient: output.externalUserId ?? 'system',
      message: String(output.message || output.response || '').trim(),
      metadata: Object.freeze({ ...(output.metadata || {}) })
    });
  }
}
export class ElanAIMvpService {
  constructor({ runtime, wahaAdapter = null }) {
    if (!runtime || typeof runtime.process !== 'function') {
      throw new TypeError('ElanAIMvpService requiere runtime');
    }

    this.runtime = runtime;
    this.wahaAdapter = wahaAdapter;
  }

  async handleIncoming(channel, payload, { send = false } = {}) {
    const result = await this.runtime.process(channel, payload);

    if (
      send &&
      channel === 'whatsapp' &&
      this.wahaAdapter &&
      result.response?.message
    ) {
      await this.wahaAdapter.sendText({
        chatId: result.response.recipient,
        text: result.response.message
      });
    }

    return result;
  }
}
export class ChannelEngine {
  constructor(registry) {
    if (!registry || typeof registry.get !== 'function') {
      throw new TypeError('ChannelEngine requiere un registry valido');
    }

    this.registry = registry;
  }

  normalize(channelName, input = {}) {
    const channel = this.registry.get(channelName);

    if (!channel) {
      throw new Error(`Channel no registrado: ${channelName}`);
    }

    const normalized = channel.normalize(input);

    if (
      !normalized ||
      typeof normalized.message !== 'string' ||
      normalized.message.trim() === ''
    ) {
      throw new TypeError(`Channel ${channelName} produjo mensaje invalido`);
    }

    return normalized;
  }

  formatResponse(channelName, output = {}) {
    const channel = this.registry.get(channelName);

    if (!channel) {
      throw new Error(`Channel no registrado: ${channelName}`);
    }

    const formatted = channel.formatResponse(output);

    if (
      !formatted ||
      typeof formatted.message !== 'string' ||
      formatted.message.trim() === ''
    ) {
      throw new TypeError(`Channel ${channelName} produjo respuesta invalida`);
    }

    return formatted;
  }
}
export class ChannelRegistry {
  #channels = new Map();

  register(channel) {
    if (
      !channel ||
      typeof channel.name !== 'string' ||
      typeof channel.normalize !== 'function' ||
      typeof channel.formatResponse !== 'function'
    ) {
      throw new TypeError('Channel invalido');
    }

    if (this.#channels.has(channel.name)) {
      throw new Error(`Channel duplicado: ${channel.name}`);
    }

    this.#channels.set(channel.name, channel);
    return this;
  }

  get(name) {
    return this.#channels.get(name) ?? null;
  }

  has(name) {
    return this.#channels.has(name);
  }

  list() {
    return Array.from(this.#channels.keys());
  }
}
import { ChannelRegistry } from './channelRegistry.js';
import { InternalChannel } from './internalChannel.js';
import { WhatsAppChannel } from './whatsAppChannel.js';

export function createDefaultChannelRegistry() {
  return new ChannelRegistry()
    .register(new InternalChannel())
    .register(new WhatsAppChannel());
}
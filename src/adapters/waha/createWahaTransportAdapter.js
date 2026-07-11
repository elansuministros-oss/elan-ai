import { loadWahaConfig } from '../../config/wahaConfig.js';
import { WahaTransportAdapter } from './wahaTransportAdapter.js';

export function createWahaTransportAdapter({
  env = process.env,
  fetchImpl = globalThis.fetch
} = {}) {
  const config = loadWahaConfig(env);

  return new WahaTransportAdapter({
    ...config,
    fetchImpl
  });
}
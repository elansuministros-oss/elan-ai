function requireValue(value, name) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${name} requerido`);
  }

  return value.trim();
}

export function loadWahaConfig(env = process.env) {
  return Object.freeze({
    baseUrl: requireValue(env.WAHA_BASE_URL, 'WAHA_BASE_URL')
      .replace(/\/+$/, ''),
    apiKey: requireValue(env.WAHA_API_KEY, 'WAHA_API_KEY'),
    session: String(env.WAHA_SESSION || 'default').trim()
  });
}
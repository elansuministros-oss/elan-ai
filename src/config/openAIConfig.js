function requireValue(value, name) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${name} requerido`);
  }

  return value.trim();
}

export function loadOpenAIConfig(env = process.env) {
  return Object.freeze({
    apiKey: requireValue(env.OPENAI_API_KEY, 'OPENAI_API_KEY'),
    model: String(env.OPENAI_MODEL || 'gpt-5-mini').trim()
  });
}
function requireValue(value, name) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${name} requerido`);
  }

  return value.trim();
}

export function loadSupabaseConfig(env = process.env) {
  return Object.freeze({
    url: requireValue(env.SUPABASE_URL, 'SUPABASE_URL'),
    key: requireValue(env.SUPABASE_SERVICE_ROLE_KEY, 'SUPABASE_SERVICE_ROLE_KEY')
  });
}
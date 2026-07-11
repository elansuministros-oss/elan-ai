import { createClient } from '@supabase/supabase-js';
import { loadSupabaseConfig } from '../../config/supabaseConfig.js';

export function createSupabaseServerClient({
  env = process.env,
  clientFactory = createClient
} = {}) {
  const config = loadSupabaseConfig(env);

  return clientFactory(
    config.url,
    config.key,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    }
  );
}
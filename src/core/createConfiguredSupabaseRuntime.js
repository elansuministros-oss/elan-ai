import { createSupabaseServerClient } from '../adapters/supabase/index.js';
import { createSupabaseElanAIRuntime } from './createSupabaseElanAIRuntime.js';

export function createConfiguredSupabaseRuntime({
  env = process.env,
  clientFactory
} = {}) {
  const client = createSupabaseServerClient({
    env,
    clientFactory
  });

  return createSupabaseElanAIRuntime({ client });
}
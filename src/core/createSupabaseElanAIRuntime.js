import {
  ChannelEngine,
  createDefaultChannelRegistry
} from '../channels/index.js';
import { dispatcher } from '../dispatcher/index.js';
import { planner } from '../planner/index.js';
import { IdentityEngine } from '../identity/index.js';
import { MemoryEngine } from '../memory/index.js';
import { StateEngine } from '../state/index.js';
import { KnowledgeEngine } from '../knowledge/index.js';
import {
  DeterministicReasoningProvider,
  ReasoningEngine
} from '../reasoning/index.js';
import {
  createDefaultOperatorRegistry
} from '../operators/index.js';
import {
  ToolEngine,
  createDefaultToolRegistry
} from '../tools/index.js';
import {
  BusinessEngine,
  createDefaultBusinessRuleRegistry
} from '../business/index.js';
import {
  SupabaseIdentityAdapter,
  SupabaseKnowledgeAdapter,
  SupabaseMemoryAdapter,
  SupabaseStateAdapter
} from '../adapters/supabase/index.js';
import { ElanAIRuntime } from './elanAIRuntime.js';

export function createSupabaseElanAIRuntime({
  client,
  reasoningProvider = new DeterministicReasoningProvider(),
  orchestratorClient
} = {}) {
  if (!client || typeof client.from !== 'function') {
    throw new TypeError('createSupabaseElanAIRuntime requiere client Supabase');
  }

  const channelEngine = new ChannelEngine(
    createDefaultChannelRegistry()
  );

  const identityEngine = new IdentityEngine(
    new SupabaseIdentityAdapter(client)
  );

  const memoryEngine = new MemoryEngine(
    new SupabaseMemoryAdapter(client)
  );

  const stateEngine = new StateEngine(
    new SupabaseStateAdapter(client)
  );

  const knowledgeEngine = new KnowledgeEngine(
    new SupabaseKnowledgeAdapter(client)
  );

  const reasoningEngine = new ReasoningEngine(
    reasoningProvider
  );

  const operatorRegistry = createDefaultOperatorRegistry();

  const toolEngine = new ToolEngine(
    createDefaultToolRegistry({ orchestratorClient })
  );

  const businessEngine = new BusinessEngine(
    createDefaultBusinessRuleRegistry()
  );

  return new ElanAIRuntime({
    channelEngine,
    dispatcher,
    identityEngine,
    planner,
    memoryEngine,
    stateEngine,
    knowledgeEngine,
    reasoningEngine,
    operatorRegistry,
    toolEngine,
    businessEngine
  });
}

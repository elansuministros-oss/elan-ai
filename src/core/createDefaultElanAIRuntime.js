import {
  ChannelEngine,
  createDefaultChannelRegistry
} from '../channels/index.js';
import { dispatcher } from '../dispatcher/index.js';
import { planner } from '../planner/index.js';
import { MemoryEngine } from '../memory/index.js';
import {
  InMemoryKnowledgeAdapter,
  KnowledgeEngine
} from '../knowledge/index.js';
import {
  DeterministicReasoningProvider,
  ReasoningEngine
} from '../reasoning/index.js';
import {
  BusinessEngine,
  createDefaultBusinessRuleRegistry
} from '../business/index.js';
import {
  createDefaultOperatorRegistry
} from '../operators/index.js';
import { ElanAIRuntime } from './elanAIRuntime.js';

export function createDefaultElanAIRuntime() {
  const channelEngine = new ChannelEngine(
    createDefaultChannelRegistry()
  );

  const memoryEngine = new MemoryEngine();

  const knowledgeEngine = new KnowledgeEngine(
    new InMemoryKnowledgeAdapter()
  );

  const reasoningEngine = new ReasoningEngine(
    new DeterministicReasoningProvider()
  );

  const businessEngine = new BusinessEngine(
    createDefaultBusinessRuleRegistry()
  );

  const operatorRegistry = createDefaultOperatorRegistry();

  return new ElanAIRuntime({
    channelEngine,
    dispatcher,
    planner,
    memoryEngine,
    knowledgeEngine,
    reasoningEngine,
    businessEngine,
    operatorRegistry
  });
}
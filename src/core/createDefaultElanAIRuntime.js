import {
  ChannelEngine,
  createDefaultChannelRegistry
} from '../channels/index.js';
import { dispatcher } from '../dispatcher/index.js';
import { planner } from '../planner/index.js';
import { MemoryEngine } from '../memory/index.js';
import {
  InMemoryStateAdapter,
  StateEngine
} from '../state/index.js';
import {
  InMemoryKnowledgeAdapter,
  KnowledgeEngine
} from '../knowledge/index.js';
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
import { ElanAIRuntime } from './elanAIRuntime.js';

export function createDefaultElanAIRuntime() {
  const channelEngine = new ChannelEngine(
    createDefaultChannelRegistry()
  );

  const memoryEngine = new MemoryEngine();

  const stateEngine = new StateEngine(
    new InMemoryStateAdapter()
  );

  const knowledgeEngine = new KnowledgeEngine(
    new InMemoryKnowledgeAdapter()
  );

  const reasoningEngine = new ReasoningEngine(
    new DeterministicReasoningProvider()
  );

  const operatorRegistry = createDefaultOperatorRegistry();

  const toolEngine = new ToolEngine(
    createDefaultToolRegistry()
  );

  const businessEngine = new BusinessEngine(
    createDefaultBusinessRuleRegistry()
  );

  return new ElanAIRuntime({
    channelEngine,
    dispatcher,
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
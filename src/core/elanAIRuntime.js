export class ElanAIRuntime {
  constructor({
    channelEngine,
    dispatcher,
    planner,
    memoryEngine,
    knowledgeEngine,
    reasoningEngine,
    operatorRegistry,
    toolEngine,
    businessEngine
  }) {
    const dependencies = {
      channelEngine,
      dispatcher,
      planner,
      memoryEngine,
      knowledgeEngine,
      reasoningEngine,
      operatorRegistry,
      toolEngine,
      businessEngine
    };

    for (const [name, dependency] of Object.entries(dependencies)) {
      if (!dependency) {
        throw new TypeError(`ElanAIRuntime requiere ${name}`);
      }
    }

    this.channelEngine = channelEngine;
    this.dispatcher = dispatcher;
    this.planner = planner;
    this.memoryEngine = memoryEngine;
    this.knowledgeEngine = knowledgeEngine;
    this.reasoningEngine = reasoningEngine;
    this.operatorRegistry = operatorRegistry;
    this.toolEngine = toolEngine;
    this.businessEngine = businessEngine;
  }

  async process(channelName, rawInput = {}) {
    const normalized = this.channelEngine.normalize(channelName, rawInput);
    const context = this.dispatcher.dispatch(normalized);

    const sessionId =
      normalized.externalUserId ||
      context.externalUserId ||
      context.requestId;

    this.memoryEngine.appendMessage(
      sessionId,
      'user',
      context.message
    );

    const plan = this.planner.createPlan(context);
    const memory = this.memoryEngine.getSession(sessionId);
    const knowledge = this.knowledgeEngine.search(context.message);

    const reasoning = await this.reasoningEngine.reason({
      context,
      plan,
      memory,
      knowledge
    });

    const operatorResult = await this.operatorRegistry.execute(
      plan.selectedOperator,
      {
        context,
        plan,
        memory,
        knowledge,
        reasoning
      }
    );

    const executableActions = (operatorResult.actions || [])
      .filter((action) => typeof action.toolName === 'string');

    const toolResults = [];

    for (const action of executableActions) {
      const toolResult = await this.toolEngine.run({
        toolName: action.toolName,
        requestId: context.requestId,
        input: action.input || {}
      });

      toolResults.push(toolResult);
    }

    const business = this.businessEngine.evaluate({
      requestId: context.requestId,
      operator: plan.selectedOperator,
      context,
      plan,
      reasoning,
      operatorResult,
      toolResults
    });

    if (!business.allowed) {
      return Object.freeze({
        requestId: context.requestId,
        sessionId,
        status: 'REJECTED',
        context,
        plan,
        reasoning,
        operator: operatorResult,
        tools: Object.freeze(toolResults),
        business,
        response: null
      });
    }

    const formatted = this.channelEngine.formatResponse(
      channelName,
      {
        externalUserId: context.externalUserId,
        response: operatorResult.response,
        metadata: {
          requestId: context.requestId,
          operator: plan.selectedOperator
        }
      }
    );

    this.memoryEngine.appendMessage(
      sessionId,
      'assistant',
      formatted.message
    );

    return Object.freeze({
      requestId: context.requestId,
      sessionId,
      status: 'COMPLETED',
      context,
      plan,
      memory: this.memoryEngine.getSession(sessionId),
      knowledge,
      reasoning,
      operator: operatorResult,
      tools: Object.freeze(toolResults),
      business,
      response: formatted
    });
  }
}
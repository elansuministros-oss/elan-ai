export class ElanAIRuntime {
  constructor({
    channelEngine,
    dispatcher,
    planner,
    memoryEngine,
    knowledgeEngine,
    reasoningEngine,
    businessEngine,
    operatorRegistry
  }) {
    const dependencies = {
      channelEngine,
      dispatcher,
      planner,
      memoryEngine,
      knowledgeEngine,
      reasoningEngine,
      businessEngine,
      operatorRegistry
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
    this.businessEngine = businessEngine;
    this.operatorRegistry = operatorRegistry;
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

    const business = this.businessEngine.evaluate({
      requestId: context.requestId,
      operator: plan.selectedOperator,
      context,
      plan,
      reasoning
    });

    if (!business.allowed) {
      return Object.freeze({
        requestId: context.requestId,
        status: 'REJECTED',
        business,
        response: null
      });
    }

    const operatorResult = await this.operatorRegistry.execute(
      plan.selectedOperator,
      {
        context,
        plan,
        memory,
        knowledge,
        reasoning,
        business
      }
    );

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
      business,
      operator: operatorResult,
      response: formatted
    });
  }
}
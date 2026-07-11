export class ElanAIRuntime {
  constructor({
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
  }) {
    const dependencies = {
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
    this.stateEngine = stateEngine;
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

    const stateKey = `${channelName}:${sessionId}`;

    const currentState = this.stateEngine.get(stateKey);

    if (!currentState) {
      this.stateEngine.set(stateKey, {
        phase: 'RECEIVED',
        channel: channelName,
        externalUserId: context.externalUserId,
        activeIntent: null,
        activeOperator: null,
        lastRequestId: context.requestId
      });
    } else {
      this.stateEngine.patch(stateKey, {
        phase: 'RECEIVED',
        lastRequestId: context.requestId
      });
    }

    this.memoryEngine.appendMessage(
      sessionId,
      'user',
      context.message
    );

    const plan = this.planner.createPlan(context);

    this.stateEngine.patch(stateKey, {
      phase: 'PLANNED',
      activeIntent: plan.intent,
      activeOperator: plan.selectedOperator,
      lastRequestId: context.requestId
    });

    const memory = this.memoryEngine.getSession(sessionId);
    const state = this.stateEngine.get(stateKey);
    const knowledge = this.knowledgeEngine.search(context.message);

    const reasoning = await this.reasoningEngine.reason({
      context,
      plan,
      memory,
      state,
      knowledge
    });

    this.stateEngine.patch(stateKey, {
      phase: 'REASONED'
    });

    const operatorResult = await this.operatorRegistry.execute(
      plan.selectedOperator,
      {
        context,
        plan,
        memory,
        state: this.stateEngine.get(stateKey),
        knowledge,
        reasoning
      }
    );

    this.stateEngine.patch(stateKey, {
      phase: 'OPERATED'
    });

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
      memory,
      state: this.stateEngine.get(stateKey),
      reasoning,
      operatorResult,
      toolResults
    });

    if (!business.allowed) {
      this.stateEngine.patch(stateKey, {
        phase: 'REJECTED'
      });

      return Object.freeze({
        requestId: context.requestId,
        sessionId,
        stateKey,
        status: 'REJECTED',
        context,
        plan,
        memory: this.memoryEngine.getSession(sessionId),
        state: this.stateEngine.get(stateKey),
        knowledge,
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

    this.stateEngine.patch(stateKey, {
      phase: 'COMPLETED'
    });

    return Object.freeze({
      requestId: context.requestId,
      sessionId,
      stateKey,
      status: 'COMPLETED',
      context,
      plan,
      memory: this.memoryEngine.getSession(sessionId),
      state: this.stateEngine.get(stateKey),
      knowledge,
      reasoning,
      operator: operatorResult,
      tools: Object.freeze(toolResults),
      business,
      response: formatted
    });
  }
}
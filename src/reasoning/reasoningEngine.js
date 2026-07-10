function assertProvider(provider) {
  if (!provider || typeof provider.generate !== 'function') {
    throw new TypeError('ReasoningEngine requiere un provider con generate()');
  }
}

function assertPlan(plan) {
  if (!plan || typeof plan !== 'object' || Array.isArray(plan)) {
    throw new TypeError('ReasoningEngine requiere un plan valido');
  }

  if (typeof plan.requestId !== 'string' || plan.requestId.trim() === '') {
    throw new TypeError('ReasoningEngine requiere requestId');
  }

  if (typeof plan.intent !== 'string' || plan.intent.trim() === '') {
    throw new TypeError('ReasoningEngine requiere intent');
  }

  if (
    typeof plan.selectedOperator !== 'string' ||
    plan.selectedOperator.trim() === ''
  ) {
    throw new TypeError('ReasoningEngine requiere selectedOperator');
  }
}

export class ReasoningEngine {
  constructor(provider) {
    assertProvider(provider);
    this.provider = provider;
  }

  async reason({ context, plan, memory = null, knowledge = [] } = {}) {
    assertPlan(plan);

    if (!context || typeof context !== 'object' || Array.isArray(context)) {
      throw new TypeError('ReasoningEngine requiere un contexto valido');
    }

    const result = await this.provider.generate({
      requestId: plan.requestId,
      message: context.message ?? '',
      channel: context.channel ?? null,
      intent: plan.intent,
      operator: plan.selectedOperator,
      memory,
      knowledge
    });

    if (!result || typeof result.text !== 'string') {
      throw new TypeError('El provider devolvio una respuesta invalida');
    }

    return Object.freeze({
      requestId: plan.requestId,
      intent: plan.intent,
      selectedOperator: plan.selectedOperator,
      provider: result.provider ?? 'unknown',
      text: result.text,
      usage: Object.freeze({
        inputTokens: result.usage?.inputTokens ?? 0,
        outputTokens: result.usage?.outputTokens ?? 0
      }),
      status: 'REASONED',
      createdAt: new Date().toISOString()
    });
  }
}
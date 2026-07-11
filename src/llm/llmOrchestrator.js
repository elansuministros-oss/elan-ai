export class LLMOrchestrator {
  constructor(reasoningEngine) {
    if (!reasoningEngine || typeof reasoningEngine.reason !== 'function') {
      throw new TypeError('LLMOrchestrator requiere ReasoningEngine');
    }
    this.reasoningEngine = reasoningEngine;
  }

  shouldReason({ plan, knowledge = [], conversation = null } = {}) {
    if (!plan) return false;
    if (plan.intent !== 'general') return true;
    if (knowledge.length > 0) return true;
    return Boolean(conversation?.turnCount);
  }

  async execute(payload) {
    if (!this.shouldReason(payload)) {
      return Object.freeze({
        skipped: true,
        text: 'Solicitud recibida',
        provider: 'none'
      });
    }

    const result = await this.reasoningEngine.reason(payload);

    return Object.freeze({
      skipped: false,
      ...result
    });
  }
}
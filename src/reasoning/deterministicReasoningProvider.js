export class DeterministicReasoningProvider {
  async generate(input = {}) {
    const message = String(input.message || '').trim();
    const intent = String(input.intent || 'general').trim();
    const operator = String(input.operator || 'general').trim();

    return {
      provider: 'deterministic',
      text: message
        ? `Intento ${intent}. Operador ${operator}. Mensaje recibido: ${message}`
        : `Intento ${intent}. Operador ${operator}.`,
      usage: {
        inputTokens: 0,
        outputTokens: 0
      }
    };
  }
}
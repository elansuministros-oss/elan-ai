export class OpenAIReasoningProvider {
  constructor({ client, model }) {
    if (
      !client ||
      !client.responses ||
      typeof client.responses.create !== 'function'
    ) {
      throw new TypeError(
        'OpenAIReasoningProvider requiere client.responses.create()'
      );
    }

    if (typeof model !== 'string' || model.trim() === '') {
      throw new TypeError('OpenAIReasoningProvider requiere model');
    }

    this.client = client;
    this.model = model.trim();
  }

  async generate(input = {}) {
    const response = await this.client.responses.create({
      model: this.model,
      input: [
        {
          role: 'system',
          content: [
            {
              type: 'input_text',
              text:
                'Eres el proveedor de razonamiento de ELAN AI. ' +
                'No inventes reglas comerciales ni ejecutes herramientas. ' +
                'Devuelve únicamente razonamiento útil para el operador.'
            }
          ]
        },
        {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: JSON.stringify({
                requestId: input.requestId ?? null,
                message: input.message ?? '',
                channel: input.channel ?? null,
                intent: input.intent ?? 'general',
                operator: input.operator ?? 'general',
                memory: input.memory ?? null,
                state: input.state ?? null,
                identity: input.identity ?? null,
                knowledge: input.knowledge ?? []
              })
            }
          ]
        }
      ]
    });

    const text = String(response.output_text || '').trim();

    if (!text) {
      throw new Error('OpenAI devolvio una respuesta vacia');
    }

    return {
      provider: 'openai',
      text,
      usage: {
        inputTokens: response.usage?.input_tokens ?? 0,
        outputTokens: response.usage?.output_tokens ?? 0
      },
      responseId: response.id ?? null
    };
  }
}
const INTENT_RULES = [
  { intent: 'quote', operator: 'sales', words: ['cotizacion', 'cotizar', 'precio', 'presupuesto'] },
  { intent: 'support', operator: 'support', words: ['ayuda', 'problema', 'error', 'soporte'] },
  { intent: 'production', operator: 'production', words: ['produccion', 'orden de trabajo', 'ot'] },
  { intent: 'crm', operator: 'crm', words: ['cliente', 'contacto', 'seguimiento'] }
];

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

function classifyIntent(message) {
  const normalized = normalizeText(message);

  for (const rule of INTENT_RULES) {
    if (rule.words.some((word) => normalized.includes(word))) {
      return {
        intent: rule.intent,
        operator: rule.operator,
        confidence: 'RULE'
      };
    }
  }

  return {
    intent: 'general',
    operator: 'general',
    confidence: 'FALLBACK'
  };
}

export class Planner {
  createPlan(context) {
    if (!context || typeof context !== 'object' || Array.isArray(context)) {
      throw new TypeError('Planner requiere un contexto valido');
    }

    if (typeof context.requestId !== 'string' || context.requestId.trim() === '') {
      throw new TypeError('Planner requiere requestId');
    }

    if (typeof context.message !== 'string' || context.message.trim() === '') {
      throw new TypeError('Planner requiere message');
    }

    const classification = classifyIntent(context.message);

    return Object.freeze({
      planId: `plan-${context.requestId}`,
      requestId: context.requestId,
      channel: context.channel ?? null,
      intent: classification.intent,
      selectedOperator: classification.operator,
      classificationSource: classification.confidence,
      steps: Object.freeze([
        'LOAD_MEMORY',
        'LOAD_KNOWLEDGE',
        'EXECUTE_REASONING',
        'EXECUTE_OPERATOR',
        'BUILD_RESPONSE',
        'SAVE_MEMORY'
      ]),
      status: 'PLANNED',
      createdAt: new Date().toISOString()
    });
  }
}

export const planner = new Planner();
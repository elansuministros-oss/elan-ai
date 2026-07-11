export class SalesBrain {
  evaluate({ context, conversation, knowledge = [] } = {}) {
    const message = String(context?.message || '').trim();
    const hasPriceIntent = /precio|cotiza|cotizacion|presupuesto/i.test(message);

    return Object.freeze({
      stage: hasPriceIntent ? 'QUOTING' : 'DISCOVERY',
      nextQuestion: hasPriceIntent
        ? null
        : '¿Qué producto necesita cotizar?',
      shouldMentionPrice: knowledge.length > 0 && hasPriceIntent,
      rules: Object.freeze([
        'RESPOND_FIRST',
        'ONE_QUESTION_MAX',
        'DO_NOT_REPEAT_CAPTURED_DATA',
        'DO_NOT_INVENT_PRICE'
      ]),
      conversationTurns: conversation?.turnCount ?? 0
    });
  }
}
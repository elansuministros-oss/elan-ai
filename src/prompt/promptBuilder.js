export class PromptBuilder {
  build({ context, rules = [] } = {}) {
    if (!context) {
      throw new TypeError('PromptBuilder requiere context');
    }

    const system = [
      'Eres ELAN AI.',
      'No inventes precios ni reglas.',
      'Usa únicamente el contexto proporcionado.',
      ...rules
    ].join(' ');

    const input = JSON.stringify(context);

    return Object.freeze({
      system,
      input
    });
  }
}
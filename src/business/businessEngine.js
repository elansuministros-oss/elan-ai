export class BusinessEngine {
  constructor(registry) {
    if (!registry || typeof registry.list !== 'function') {
      throw new TypeError('BusinessEngine requiere un registry valido');
    }

    this.registry = registry;
  }

  evaluate(input = {}) {
    const results = this.registry.list().map((rule) => {
      const output = rule.evaluate(input);

      if (
        !output ||
        typeof output !== 'object' ||
        typeof output.allowed !== 'boolean'
      ) {
        throw new TypeError(`Resultado invalido en regla: ${rule.id}`);
      }

      return Object.freeze({
        ruleId: rule.id,
        description: rule.description,
        allowed: output.allowed,
        reason: output.reason ?? null,
        data: Object.freeze({ ...(output.data || {}) })
      });
    });

    const blocked = results.filter((result) => !result.allowed);

    return Object.freeze({
      allowed: blocked.length === 0,
      results: Object.freeze(results),
      blockedBy: Object.freeze(blocked.map((result) => result.ruleId)),
      status: blocked.length === 0 ? 'APPROVED' : 'REJECTED'
    });
  }
}
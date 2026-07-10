import { BusinessRule } from './businessRule.js';
import { BusinessRuleRegistry } from './businessRuleRegistry.js';

export function createDefaultBusinessRuleRegistry() {
  return new BusinessRuleRegistry()
    .register(
      new BusinessRule({
        id: 'REQUIRE_OPERATOR',
        description: 'Toda ejecucion debe declarar operador',
        evaluate(input) {
          const operator = String(input.operator || '').trim();

          return {
            allowed: operator.length > 0,
            reason: operator.length > 0
              ? null
              : 'No se definio operador'
          };
        }
      })
    )
    .register(
      new BusinessRule({
        id: 'REQUIRE_REQUEST_ID',
        description: 'Toda ejecucion debe declarar requestId',
        evaluate(input) {
          const requestId = String(input.requestId || '').trim();

          return {
            allowed: requestId.length > 0,
            reason: requestId.length > 0
              ? null
              : 'No se definio requestId'
          };
        }
      })
    );
}
import { GeneralOperator } from './generalOperator.js';
import { OperatorRegistry } from './operatorRegistry.js';
import { SalesOperator } from './salesOperator.js';
import { TaskOperator } from './taskOperator.js';

export function createDefaultOperatorRegistry() {
  return new OperatorRegistry()
    .register(new GeneralOperator())
    .register(new SalesOperator())
    .register(new TaskOperator('crm'))
    .register(new TaskOperator('support'))
    .register(new TaskOperator('production'));
}
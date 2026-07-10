import { GeneralOperator } from './generalOperator.js';
import { OperatorRegistry } from './operatorRegistry.js';
import { SalesOperator } from './salesOperator.js';

export function createDefaultOperatorRegistry() {
  return new OperatorRegistry()
    .register(new GeneralOperator())
    .register(new SalesOperator());
}
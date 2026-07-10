import { BaseOperator } from './baseOperator.js';

export class GeneralOperator extends BaseOperator {
  constructor() {
    super('general');
  }

  async execute({ context, reasoning } = {}) {
    return Object.freeze({
      operator: this.name,
      requestId: reasoning?.requestId ?? context?.requestId ?? null,
      response: reasoning?.text ?? 'Solicitud recibida',
      actions: Object.freeze([]),
      status: 'COMPLETED'
    });
  }
}
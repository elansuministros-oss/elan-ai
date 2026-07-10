import { BaseOperator } from './baseOperator.js';

export class SalesOperator extends BaseOperator {
  constructor() {
    super('sales');
  }

  async execute({ context, reasoning } = {}) {
    const message = context?.message ?? '';

    return Object.freeze({
      operator: this.name,
      requestId: reasoning?.requestId ?? context?.requestId ?? null,
      response: reasoning?.text ?? message,
      actions: Object.freeze([
        Object.freeze({
          type: 'CAPTURE_SALES_CONTEXT',
          status: 'PENDING'
        })
      ]),
      status: 'COMPLETED'
    });
  }
}
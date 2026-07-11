import { BaseOperator } from './baseOperator.js';

export class TaskOperator extends BaseOperator {
  constructor(name) {
    super(name);
  }

  async execute({ context, reasoning } = {}) {
    return Object.freeze({
      operator: this.name,
      requestId: reasoning?.requestId ?? context?.requestId ?? null,
      response: reasoning?.text ?? context?.message ?? 'Solicitud recibida',
      actions: Object.freeze([]),
      status: 'COMPLETED'
    });
  }
}
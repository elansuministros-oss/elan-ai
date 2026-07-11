import { BaseTool } from '../../tools/baseTool.js';

export class WahaSendTextTool extends BaseTool {
  constructor(adapter) {
    super('waha.sendText');

    if (!adapter || typeof adapter.sendText !== 'function') {
      throw new TypeError('WahaSendTextTool requiere adapter valido');
    }

    this.adapter = adapter;
  }

  async execute(input = {}) {
    const result = await this.adapter.sendText(input);

    return {
      status: result.status,
      data: result
    };
  }
}
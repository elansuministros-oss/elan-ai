import { BaseTool } from './baseTool.js';

export class EchoTool extends BaseTool {
  constructor() {
    super('echo');
  }

  async execute(input = {}) {
    return {
      status: 'SUCCESS',
      data: Object.freeze({ ...input })
    };
  }
}
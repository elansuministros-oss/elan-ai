export class MemoryConsolidator {
  constructor({ maxMessages = 20, summaryMessages = 8 } = {}) {
    this.maxMessages = maxMessages;
    this.summaryMessages = summaryMessages;
  }

  consolidate(session) {
    if (!session) {
      return Object.freeze({
        shortTerm: Object.freeze([]),
        longTermSummary: ''
      });
    }

    const shortTerm = session.messages
      .slice(-this.maxMessages)
      .map((message) => Object.freeze({ ...message }));

    const longTermSummary = session.messages
      .slice(-this.summaryMessages)
      .map((message) => `[${message.role}] ${message.content}`)
      .join(' | ');

    return Object.freeze({
      shortTerm: Object.freeze(shortTerm),
      longTermSummary
    });
  }
}
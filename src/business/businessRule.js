export class BusinessRule {
  constructor({ id, description, evaluate }) {
    if (typeof id !== 'string' || id.trim() === '') {
      throw new TypeError('BusinessRule requiere id');
    }

    if (typeof description !== 'string' || description.trim() === '') {
      throw new TypeError('BusinessRule requiere description');
    }

    if (typeof evaluate !== 'function') {
      throw new TypeError('BusinessRule requiere evaluate');
    }

    this.id = id.trim();
    this.description = description.trim();
    this.evaluate = evaluate;
  }
}
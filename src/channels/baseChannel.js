export class BaseChannel {
  constructor(name) {
    if (typeof name !== 'string' || name.trim() === '') {
      throw new TypeError('Channel requiere un nombre valido');
    }

    this.name = name.trim();
  }

  normalize() {
    throw new Error(`Channel ${this.name} debe implementar normalize()`);
  }

  formatResponse() {
    throw new Error(`Channel ${this.name} debe implementar formatResponse()`);
  }
}
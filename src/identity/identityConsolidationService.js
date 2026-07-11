export class IdentityConsolidationService {
  constructor(identityEngine) {
    if (!identityEngine || typeof identityEngine.resolve !== 'function') {
      throw new TypeError('IdentityConsolidationService requiere IdentityEngine');
    }
    this.identityEngine = identityEngine;
  }

  async consolidate(input = {}) {
    const result = await this.identityEngine.resolve(input);

    return Object.freeze({
      identityId: result.identity.identityId,
      created: result.created,
      merged: result.merged ?? false,
      links: Object.freeze(result.identity.links.map((link) =>
        Object.freeze({ ...link })
      )),
      identity: result.identity
    });
  }
}
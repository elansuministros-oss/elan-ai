export class InMemoryIdentityAdapter {
  #identities = new Map();
  #externalIndex = new Map();

  save(identity) {
    const stored = structuredClone(identity);

    this.#identities.set(stored.identityId, stored);

    for (const link of stored.links) {
      this.#externalIndex.set(
        `${link.channel}:${link.externalUserId}`,
        stored.identityId
      );
    }

    return structuredClone(stored);
  }

  getById(identityId) {
    const identity = this.#identities.get(identityId);
    return identity ? structuredClone(identity) : null;
  }

  findByExternal(channel, externalUserId) {
    const identityId = this.#externalIndex.get(
      `${channel}:${externalUserId}`
    );

    return identityId
      ? this.getById(identityId)
      : null;
  }

  list() {
    return Array.from(
      this.#identities.values(),
      (identity) => structuredClone(identity)
    );
  }
}
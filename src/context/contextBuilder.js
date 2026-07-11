export class ContextBuilder {
  build({
    identity,
    conversation,
    memory,
    state,
    knowledge,
    plan
  } = {}) {
    if (!identity?.identityId) {
      throw new TypeError('ContextBuilder requiere identity');
    }

    return Object.freeze({
      identity: Object.freeze({
        identityId: identity.identityId,
        displayName: identity.displayName ?? null,
        phone: identity.phone ?? null,
        email: identity.email ?? null
      }),
      conversation: conversation ?? null,
      memory: memory ?? null,
      state: state ?? null,
      knowledge: Object.freeze([...(knowledge || [])]),
      plan: plan ?? null
    });
  }
}
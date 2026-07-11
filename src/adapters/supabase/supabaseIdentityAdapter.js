export class SupabaseIdentityAdapter {
  constructor(client) {
    if (!client || typeof client.from !== 'function') {
      throw new TypeError('SupabaseIdentityAdapter requiere client valido');
    }

    this.client = client;
  }

  async save(identity) {
    const identityRow = {
      identity_id: identity.identityId,
      display_name: identity.displayName ?? null,
      phone: identity.phone ?? null,
      email: identity.email ?? null,
      metadata: identity.metadata ?? {},
      created_at: identity.createdAt,
      updated_at: identity.updatedAt
    };

    const { error: identityError } = await this.client
      .from('elan_ai_identities')
      .upsert(identityRow, {
        onConflict: 'identity_id'
      });

    if (identityError) {
      throw new Error(
        `SupabaseIdentityAdapter save identity: ${identityError.message}`
      );
    }

    const linkRows = (identity.links || []).map((link) => ({
      identity_id: identity.identityId,
      channel: link.channel,
      external_user_id: link.externalUserId
    }));

    if (linkRows.length > 0) {
      const { error: linkError } = await this.client
        .from('elan_ai_identity_links')
        .upsert(linkRows, {
          onConflict: 'channel,external_user_id'
        });

      if (linkError) {
        throw new Error(
          `SupabaseIdentityAdapter save links: ${linkError.message}`
        );
      }
    }

    return structuredClone(identity);
  }

  async getById(identityId) {
    const { data: identityRow, error: identityError } = await this.client
      .from('elan_ai_identities')
      .select('*')
      .eq('identity_id', identityId)
      .maybeSingle();

    if (identityError) {
      throw new Error(
        `SupabaseIdentityAdapter getById: ${identityError.message}`
      );
    }

    if (!identityRow) {
      return null;
    }

    const { data: linkRows, error: linkError } = await this.client
      .from('elan_ai_identity_links')
      .select('channel,external_user_id')
      .eq('identity_id', identityId);

    if (linkError) {
      throw new Error(
        `SupabaseIdentityAdapter get links: ${linkError.message}`
      );
    }

    return this.#mapIdentity(identityRow, linkRows || []);
  }

  async findByExternal(channel, externalUserId) {
    const { data: linkRow, error: linkError } = await this.client
      .from('elan_ai_identity_links')
      .select('identity_id')
      .eq('channel', channel)
      .eq('external_user_id', externalUserId)
      .maybeSingle();

    if (linkError) {
      throw new Error(
        `SupabaseIdentityAdapter findByExternal: ${linkError.message}`
      );
    }

    if (!linkRow) {
      return null;
    }

    return this.getById(linkRow.identity_id);
  }

  async list() {
    const { data: identityRows, error: identityError } = await this.client
      .from('elan_ai_identities')
      .select('*');

    if (identityError) {
      throw new Error(
        `SupabaseIdentityAdapter list: ${identityError.message}`
      );
    }

    const results = [];

    for (const identityRow of identityRows || []) {
      const identity = await this.getById(identityRow.identity_id);
      if (identity) {
        results.push(identity);
      }
    }

    return results;
  }

  #mapIdentity(identityRow, linkRows) {
    return {
      identityId: identityRow.identity_id,
      displayName: identityRow.display_name,
      phone: identityRow.phone,
      email: identityRow.email,
      links: linkRows.map((link) => ({
        channel: link.channel,
        externalUserId: link.external_user_id
      })),
      metadata: identityRow.metadata || {},
      createdAt: identityRow.created_at,
      updatedAt: identityRow.updated_at
    };
  }
}
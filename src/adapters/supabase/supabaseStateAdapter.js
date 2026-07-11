export class SupabaseStateAdapter {
  constructor(client) {
    if (!client || typeof client.from !== 'function') {
      throw new TypeError('SupabaseStateAdapter requiere client valido');
    }

    this.client = client;
  }

  async save(key, value) {
    const row = {
      state_key: key,
      identity_id: value.data?.identityId ?? null,
      version: value.version,
      data: value.data ?? {},
      updated_at: value.updatedAt
    };

    const { error } = await this.client
      .from('elan_ai_states')
      .upsert(row, {
        onConflict: 'state_key'
      });

    if (error) {
      throw new Error(
        `SupabaseStateAdapter save: ${error.message}`
      );
    }

    return structuredClone(value);
  }

  async get(key) {
    const { data, error } = await this.client
      .from('elan_ai_states')
      .select('*')
      .eq('state_key', key)
      .maybeSingle();

    if (error) {
      throw new Error(
        `SupabaseStateAdapter get: ${error.message}`
      );
    }

    if (!data) {
      return null;
    }

    return {
      key: data.state_key,
      version: data.version,
      data: data.data ?? {},
      updatedAt: data.updated_at
    };
  }

  async delete(key) {
    const { error } = await this.client
      .from('elan_ai_states')
      .delete()
      .eq('state_key', key);

    if (error) {
      throw new Error(
        `SupabaseStateAdapter delete: ${error.message}`
      );
    }

    return true;
  }

  async list() {
    const { data, error } = await this.client
      .from('elan_ai_states')
      .select('*');

    if (error) {
      throw new Error(
        `SupabaseStateAdapter list: ${error.message}`
      );
    }

    return (data || []).map((row) => ({
      key: row.state_key,
      value: {
        key: row.state_key,
        version: row.version,
        data: row.data ?? {},
        updatedAt: row.updated_at
      }
    }));
  }
}
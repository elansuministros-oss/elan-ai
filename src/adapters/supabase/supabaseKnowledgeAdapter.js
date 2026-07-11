export class SupabaseKnowledgeAdapter {
  constructor(client) {
    if (!client || typeof client.from !== 'function') {
      throw new TypeError('SupabaseKnowledgeAdapter requiere client valido');
    }

    this.client = client;
  }

  async save(record) {
    const row = {
      knowledge_id: record.id,
      title: record.title,
      content: record.content,
      source: record.source,
      type: record.type ?? 'document',
      metadata: record.metadata ?? {},
      created_at: record.createdAt,
      updated_at: record.updatedAt
    };

    const { error } = await this.client
      .from('elan_ai_knowledge')
      .upsert(row, { onConflict: 'knowledge_id' });

    if (error) {
      throw new Error(
        `SupabaseKnowledgeAdapter save: ${error.message}`
      );
    }

    return structuredClone(record);
  }

  async getById(id) {
    const { data, error } = await this.client
      .from('elan_ai_knowledge')
      .select('*')
      .eq('knowledge_id', id)
      .maybeSingle();

    if (error) {
      throw new Error(
        `SupabaseKnowledgeAdapter getById: ${error.message}`
      );
    }

    return data ? this.#map(data) : null;
  }

  async list() {
    const { data, error } = await this.client
      .from('elan_ai_knowledge')
      .select('*');

    if (error) {
      throw new Error(
        `SupabaseKnowledgeAdapter list: ${error.message}`
      );
    }

    return (data || []).map((row) => this.#map(row));
  }

  #map(row) {
    return {
      id: row.knowledge_id,
      title: row.title,
      content: row.content,
      source: row.source,
      type: row.type,
      metadata: row.metadata ?? {},
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}
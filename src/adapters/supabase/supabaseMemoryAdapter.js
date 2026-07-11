export class SupabaseMemoryAdapter {
  constructor(client) {
    if (!client || typeof client.from !== 'function') {
      throw new TypeError('SupabaseMemoryAdapter requiere client valido');
    }

    this.client = client;
  }

  async save(session) {
    const sessionRow = {
      session_id: session.sessionId,
      identity_id: session.sessionId,
      summary: session.summary ?? '',
      created_at: session.createdAt,
      updated_at: session.updatedAt
    };

    const { error: sessionError } = await this.client
      .from('elan_ai_memory_sessions')
      .upsert(sessionRow, {
        onConflict: 'session_id'
      });

    if (sessionError) {
      throw new Error(
        `SupabaseMemoryAdapter save session: ${sessionError.message}`
      );
    }

    const { error: deleteError } = await this.client
      .from('elan_ai_memory_messages')
      .delete()
      .eq('session_id', session.sessionId);

    if (deleteError) {
      throw new Error(
        `SupabaseMemoryAdapter delete messages: ${deleteError.message}`
      );
    }

    const messageRows = (session.messages || []).map((message) => ({
      session_id: session.sessionId,
      role: message.role,
      content: message.content,
      created_at: message.at
    }));

    if (messageRows.length > 0) {
      const { error: messageError } = await this.client
        .from('elan_ai_memory_messages')
        .insert(messageRows);

      if (messageError) {
        throw new Error(
          `SupabaseMemoryAdapter save messages: ${messageError.message}`
        );
      }
    }

    return structuredClone(session);
  }

  async get(sessionId) {
    const { data: sessionRow, error: sessionError } = await this.client
      .from('elan_ai_memory_sessions')
      .select('*')
      .eq('session_id', sessionId)
      .maybeSingle();

    if (sessionError) {
      throw new Error(
        `SupabaseMemoryAdapter get session: ${sessionError.message}`
      );
    }

    if (!sessionRow) {
      return null;
    }

    const { data: messageRows, error: messageError } = await this.client
      .from('elan_ai_memory_messages')
      .select('role,content,created_at')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (messageError) {
      throw new Error(
        `SupabaseMemoryAdapter get messages: ${messageError.message}`
      );
    }

    return {
      sessionId: sessionRow.session_id,
      messages: (messageRows || []).map((message) => ({
        role: message.role,
        content: message.content,
        at: message.created_at
      })),
      summary: sessionRow.summary ?? '',
      createdAt: sessionRow.created_at,
      updatedAt: sessionRow.updated_at
    };
  }

  async delete(sessionId) {
    const { error } = await this.client
      .from('elan_ai_memory_sessions')
      .delete()
      .eq('session_id', sessionId);

    if (error) {
      throw new Error(
        `SupabaseMemoryAdapter delete session: ${error.message}`
      );
    }

    return true;
  }

  async list() {
    const { data: sessionRows, error } = await this.client
      .from('elan_ai_memory_sessions')
      .select('session_id');

    if (error) {
      throw new Error(
        `SupabaseMemoryAdapter list: ${error.message}`
      );
    }

    const sessions = [];

    for (const row of sessionRows || []) {
      const session = await this.get(row.session_id);

      if (session) {
        sessions.push(session);
      }
    }

    return sessions;
  }
}
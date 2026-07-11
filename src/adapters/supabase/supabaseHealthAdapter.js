export class SupabaseHealthAdapter {
  constructor(client) {
    if (!client || typeof client.from !== 'function') {
      throw new TypeError('SupabaseHealthAdapter requiere client valido');
    }

    this.client = client;
  }

  async check() {
    const { error } = await this.client
      .from('elan_ai_health')
      .select('id')
      .limit(1);

    return Object.freeze({
      ok: !error,
      error: error?.message ?? null
    });
  }
}
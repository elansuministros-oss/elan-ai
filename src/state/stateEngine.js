function requireKey(value) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new TypeError('StateEngine requiere key');
  }

  return value.trim();
}

function validateAdapter(adapter) {
  if (
    !adapter ||
    typeof adapter.save !== 'function' ||
    typeof adapter.get !== 'function' ||
    typeof adapter.delete !== 'function' ||
    typeof adapter.list !== 'function'
  ) {
    throw new TypeError('StateEngine requiere un adapter valido');
  }
}

export class StateEngine {
  constructor(adapter) {
    validateAdapter(adapter);
    this.adapter = adapter;
  }

  async set(key, data = {}) {
    const normalizedKey = requireKey(key);
    const current = await this.adapter.get(normalizedKey);

    const next = Object.freeze({
      key: normalizedKey,
      version: (current?.version ?? 0) + 1,
      data: Object.freeze({ ...data }),
      updatedAt: new Date().toISOString()
    });

    return this.adapter.save(normalizedKey, next);
  }

  async get(key) {
    return this.adapter.get(requireKey(key));
  }

  async patch(key, partial = {}) {
    const normalizedKey = requireKey(key);
    const current = await this.get(normalizedKey);

    if (!current) {
      throw new Error(`State no encontrado: ${normalizedKey}`);
    }

    return this.set(normalizedKey, {
      ...current.data,
      ...partial
    });
  }

  async remove(key) {
    return this.adapter.delete(requireKey(key));
  }

  async list() {
    return this.adapter.list();
  }
}
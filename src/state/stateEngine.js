function requireKey(value) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new TypeError('StateEngine requiere key');
  }

  return value.trim();
}

export class StateEngine {
  constructor(adapter) {
    if (
      !adapter ||
      typeof adapter.save !== 'function' ||
      typeof adapter.get !== 'function'
    ) {
      throw new TypeError('StateEngine requiere un adapter valido');
    }

    this.adapter = adapter;
  }

  set(key, data = {}) {
    const normalizedKey = requireKey(key);

    const current = this.adapter.get(normalizedKey);

    const next = Object.freeze({
      key: normalizedKey,
      version: (current?.version ?? 0) + 1,
      data: Object.freeze({ ...data }),
      updatedAt: new Date().toISOString()
    });

    return this.adapter.save(normalizedKey, next);
  }

  get(key) {
    return this.adapter.get(requireKey(key));
  }

  patch(key, partial = {}) {
    const normalizedKey = requireKey(key);
    const current = this.get(normalizedKey);

    if (!current) {
      throw new Error(`State no encontrado: ${normalizedKey}`);
    }

    return this.set(normalizedKey, {
      ...current.data,
      ...partial
    });
  }

  remove(key) {
    return this.adapter.delete(requireKey(key));
  }

  list() {
    return this.adapter.list();
  }
}
function requireText(value, fieldName) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new TypeError(`${fieldName} requerido`);
  }

  return value.trim();
}

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export class KnowledgeEngine {
  constructor(adapter) {
    if (!adapter || typeof adapter.save !== 'function' || typeof adapter.list !== 'function') {
      throw new TypeError('KnowledgeEngine requiere un adapter valido');
    }

    this.adapter = adapter;
  }

  register(input = {}) {
    const id = requireText(input.id, 'id');
    const title = requireText(input.title, 'title');
    const content = requireText(input.content, 'content');
    const source = requireText(input.source, 'source');

    const record = Object.freeze({
      id,
      title,
      content,
      source,
      type: input.type ? requireText(input.type, 'type') : 'document',
      metadata: Object.freeze({ ...(input.metadata || {}) }),
      createdAt: new Date().toISOString()
    });

    return this.adapter.save(record);
  }

  getById(id) {
    return this.adapter.getById(requireText(id, 'id'));
  }

  search(query) {
    const normalizedQuery = normalizeText(requireText(query, 'query'));
    const tokens = normalizedQuery.split(/\s+/).filter(Boolean);

    return this.adapter
      .list()
      .map((record) => {
        const searchable = normalizeText(
          `${record.title} ${record.content} ${record.source} ${record.type}`
        );

        const score = tokens.reduce(
          (total, token) => total + (searchable.includes(token) ? 1 : 0),
          0
        );

        return { record, score };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((item) => ({
        ...item.record,
        score: item.score
      }));
  }
}
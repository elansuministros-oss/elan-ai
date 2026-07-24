const DEFAULT_BASE_URL = 'http://172.19.0.1:4100';
const DEFAULT_TIMEOUT_MS = 8000;

function normalizeBaseUrl(value) {
  return String(value || DEFAULT_BASE_URL).trim().replace(/\/+$/, '');
}

function normalizePath(value) {
  const path = String(value || '').trim();
  if (!path) throw new TypeError('OrchestratorClient requiere path');
  return path.startsWith('/') ? path : `/${path}`;
}

export class OrchestratorClient {
  constructor({
    baseUrl = process.env.ORCHESTRATOR_BASE_URL,
    internalToken = process.env.ELAN_AI_INTERNAL_TOKEN,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    fetchImpl = globalThis.fetch
  } = {}) {
    if (typeof fetchImpl !== 'function') {
      throw new TypeError('OrchestratorClient requiere fetch');
    }

    this.baseUrl = normalizeBaseUrl(baseUrl);
    this.internalToken = String(internalToken || '').trim();
    this.timeoutMs = Number.isFinite(timeoutMs) && timeoutMs > 0
      ? timeoutMs
      : DEFAULT_TIMEOUT_MS;
    this.fetchImpl = fetchImpl;
  }

  async get(path) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await this.fetchImpl(`${this.baseUrl}${normalizePath(path)}`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: controller.signal
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const error = new Error(`ORCHESTRATOR_HTTP_${response.status}`);
        error.status = response.status;
        error.details = data;
        throw error;
      }

      return data;
    } finally {
      clearTimeout(timeout);
    }
  }

  async post(path, body) {
    if (!this.internalToken) {
      throw new Error('ORCHESTRATOR_INTERNAL_TOKEN_REQUIRED');
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await this.fetchImpl(
        `${this.baseUrl}${normalizePath(path)}`,
        {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'X-ELAN-AI-Token': this.internalToken
          },
          body: JSON.stringify(body),
          signal: controller.signal
        }
      );
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const error = new Error(`ORCHESTRATOR_HTTP_${response.status}`);
        error.status = response.status;
        error.details = data;
        throw error;
      }

      return data;
    } finally {
      clearTimeout(timeout);
    }
  }

  getHealth() { return this.get('/api/health'); }
  getDashboard() { return this.get('/api/dashboard'); }
  getProjects() { return this.get('/api/projects'); }
  getEcosystem() { return this.get('/api/ecosystem'); }
  getGithub() { return this.get('/api/github'); }
  getDocker() { return this.get('/api/docker'); }
  executeConnectTool(input) { return this.post('/api/tools/connect', input); }
}

export function createOrchestratorClient(options = {}) {
  return new OrchestratorClient(options);
}

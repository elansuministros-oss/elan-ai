import {
  RUNTIME_CONTRACT_VERSION,
  createRuntimeMessageResponse,
  parseRuntimeMessageRequest,
  toRuntimeInput
} from '../contracts/index.js';

const MAX_BODY_BYTES = 1024 * 1024;

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
  });
  response.end(JSON.stringify(payload));
}

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    let body = '';
    let receivedBytes = 0;

    request.on('data', (chunk) => {
      receivedBytes += chunk.length;
      if (receivedBytes > MAX_BODY_BYTES) {
        reject(Object.assign(
          new Error('Payload demasiado grande'),
          { code: 'PAYLOAD_TOO_LARGE' }
        ));
        request.destroy();
        return;
      }
      body += chunk.toString('utf8');
    });

    request.on('end', () => {
      if (!body.trim()) {
        reject(Object.assign(
          new Error('Body JSON obligatorio'),
          { code: 'BODY_REQUIRED' }
        ));
        return;
      }

      try {
        resolve(JSON.parse(body));
      } catch {
        reject(Object.assign(
          new Error('JSON inválido'),
          { code: 'INVALID_JSON' }
        ));
      }
    });

    request.on('error', reject);
  });
}

function isAuthorized(request, authToken) {
  if (!authToken) return false;
  return request.headers['x-elan-ai-token'] === authToken;
}

export function createRuntimeHttpHandler({ runtime, authToken }) {
  if (!runtime || typeof runtime.process !== 'function') {
    throw new TypeError('RuntimeHttpService requiere runtime');
  }

  if (typeof authToken !== 'string' || authToken.trim() === '') {
    throw new TypeError('RuntimeHttpService requiere authToken');
  }

  return async function handleRuntimeRequest(request, response) {
    const requestUrl = new URL(
      request.url,
      `http://${request.headers.host || 'localhost'}`
    );

    if (
      request.method === 'GET' &&
      requestUrl.pathname === '/health'
    ) {
      sendJson(response, 200, {
        service: 'ELAN IA Runtime',
        status: 'READY',
        contractVersion: RUNTIME_CONTRACT_VERSION
      });
      return;
    }

    if (requestUrl.pathname !== '/v1/runtime/messages') {
      sendJson(response, 404, {
        error: {
          code: 'ROUTE_NOT_FOUND',
          message: 'Ruta no encontrada'
        }
      });
      return;
    }

    if (request.method !== 'POST') {
      response.setHeader('Allow', 'POST');
      sendJson(response, 405, {
        error: {
          code: 'METHOD_NOT_ALLOWED',
          message: 'Método no permitido'
        }
      });
      return;
    }

    if (!isAuthorized(request, authToken)) {
      sendJson(response, 401, {
        error: {
          code: 'UNAUTHORIZED',
          message: 'Credencial interna inválida'
        }
      });
      return;
    }

    try {
      const body = await readJsonBody(request);
      const runtimeRequest = parseRuntimeMessageRequest(body);
      const result = await runtime.process(
        runtimeRequest.channel,
        toRuntimeInput(runtimeRequest),
        {
          executeTools: runtimeRequest.mode === 'active'
        }
      );

      sendJson(
        response,
        200,
        createRuntimeMessageResponse(runtimeRequest, result)
      );
    } catch (error) {
      const inputError =
        error instanceof TypeError ||
        error instanceof RangeError ||
        [
          'BODY_REQUIRED',
          'INVALID_JSON',
          'PAYLOAD_TOO_LARGE'
        ].includes(error.code);

      sendJson(response, inputError ? 400 : 500, {
        error: {
          code: inputError
            ? error.code || 'INVALID_RUNTIME_REQUEST'
            : 'RUNTIME_EXECUTION_FAILED',
          message: inputError
            ? error.message
            : 'No fue posible procesar la solicitud'
        }
      });
    }
  };
}

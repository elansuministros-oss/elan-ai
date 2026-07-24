import { createServer } from 'node:http';
import { createDefaultElanAIRuntime } from './core/index.js';
import { createRuntimeHttpHandler } from './http/index.js';

const host = process.env.ELAN_AI_HOST || '127.0.0.1';
const port = Number.parseInt(process.env.ELAN_AI_PORT || '4200', 10);
const authToken = String(process.env.ELAN_AI_INTERNAL_TOKEN || '').trim();

if (!authToken) {
  throw new Error('ELAN_AI_INTERNAL_TOKEN es obligatorio');
}

const runtime = createDefaultElanAIRuntime();
const server = createServer(
  createRuntimeHttpHandler({
    runtime,
    authToken
  })
);

server.listen(port, host, () => {
  console.log(
    `ELAN IA Runtime activo en http://${host}:${port}`
  );
});

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const [, , command, type, nameArg] = process.argv;

const typeMap = {
  planner: 'planner',
  memory: 'memory',
  knowledge: 'knowledge',
  operator: 'operators',
  tool: 'tools',
  channel: 'channels'
};

function ensureProject() {
  const pkg = path.join(root, 'package.json');
  const src = path.join(root, 'src');

  if (!fs.existsSync(pkg) || !fs.existsSync(src)) {
    throw new Error('Ejecuta ELAN CLI desde la raiz de ELAN_AI');
  }
}

function doctor() {
  ensureProject();

  const required = [
    'src/dispatcher',
    'src/planner',
    'src/memory',
    'src/knowledge',
    'src/operators',
    'src/tools',
    'src/channels',
    'tests'
  ];

  const missing = required.filter(
    (item) => !fs.existsSync(path.join(root, item))
  );

  if (missing.length > 0) {
    console.error('ELAN_CLI_DOCTOR=ERROR');
    console.error('Faltan: ' + missing.join(', '));
    process.exitCode = 1;
    return;
  }

  console.log('ELAN_CLI_DOCTOR=OK');
}

function normalizeName(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function makeModule(moduleType, rawName) {
  ensureProject();

  const folder = typeMap[moduleType];

  if (!folder) {
    throw new Error('Tipo no soportado: ' + moduleType);
  }

  const name = normalizeName(rawName || moduleType);

  if (!name) {
    throw new Error('Nombre de modulo invalido');
  }

  const targetDir = path.join(root, 'src', folder);
  const targetFile = path.join(targetDir, name + '.js');
  const testFile = path.join(root, 'tests', name + '.test.js');

  fs.mkdirSync(targetDir, { recursive: true });

  if (fs.existsSync(targetFile) || fs.existsSync(testFile)) {
    throw new Error('El modulo ya existe: ' + name);
  }

  const className = name
    .split('-')
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join('');

  const moduleSource =
    `export class ${className} {\n` +
    `  execute(input = {}) {\n` +
    `    return { module: '${name}', input };\n` +
    `  }\n` +
    `}\n`;

  const testSource =
    `import assert from 'node:assert/strict';\n` +
    `import test from 'node:test';\n` +
    `import { ${className} } from '../src/${folder}/${name}.js';\n\n` +
    `test('${className} ejecuta contrato base', () => {\n` +
    `  const instance = new ${className}();\n` +
    `  assert.deepEqual(instance.execute({ ok: true }), {\n` +
    `    module: '${name}',\n` +
    `    input: { ok: true }\n` +
    `  });\n` +
    `});\n`;

  fs.writeFileSync(targetFile, moduleSource, 'utf8');
  fs.writeFileSync(testFile, testSource, 'utf8');

  console.log('ELAN_CLI_CREATED=' + path.relative(root, targetFile));
  console.log('ELAN_CLI_TEST=' + path.relative(root, testFile));
}

try {
  if (command === 'doctor') {
    doctor();
  } else if (command === 'make') {
    makeModule(type, nameArg);
  } else {
    console.log('Uso:');
    console.log('  npm run elan -- doctor');
    console.log('  npm run elan -- make planner');
    console.log('  npm run elan -- make operator sales');
  }
} catch (error) {
  console.error('ELAN_CLI_ERROR=' + error.message);
  process.exitCode = 1;
}
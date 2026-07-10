import assert from 'node:assert/strict';
import test from 'node:test';
import { spawnSync } from 'node:child_process';

test('ELAN CLI doctor valida la estructura', () => {
  const result = spawnSync(
    process.execPath,
    ['cli/elan.js', 'doctor'],
    {
      cwd: process.cwd(),
      encoding: 'utf8'
    }
  );

  assert.equal(result.status, 0);
  assert.match(result.stdout, /ELAN_CLI_DOCTOR=OK/);
});
import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const migrationPath =
  'supabase/migrations/20260710_001_elan_ai_foundation.sql';

test('Migracion Supabase define tablas esenciales', () => {
  const sql = fs.readFileSync(migrationPath, 'utf8');

  const requiredTables = [
    'elan_ai_identities',
    'elan_ai_identity_links',
    'elan_ai_memory_sessions',
    'elan_ai_memory_messages',
    'elan_ai_states',
    'elan_ai_knowledge',
    'elan_ai_health'
  ];

  for (const table of requiredTables) {
    assert.match(sql, new RegExp(`create table if not exists public\\.${table}`));
  }
});

test('Migracion habilita RLS en todas las tablas', () => {
  const sql = fs.readFileSync(migrationPath, 'utf8');

  const requiredTables = [
    'elan_ai_identities',
    'elan_ai_identity_links',
    'elan_ai_memory_sessions',
    'elan_ai_memory_messages',
    'elan_ai_states',
    'elan_ai_knowledge',
    'elan_ai_health'
  ];

  for (const table of requiredTables) {
    assert.match(
      sql,
      new RegExp(`alter table public\\.${table} enable row level security`)
    );
  }
});

test('Migracion no contiene políticas públicas', () => {
  const sql = fs.readFileSync(migrationPath, 'utf8');

  assert.doesNotMatch(sql, /create policy/i);
  assert.doesNotMatch(sql, /grant all/i);
});
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  IdentityConsolidationService,
  IdentityEngine,
  InMemoryIdentityAdapter
} from '../src/identity/index.js';

test('Consolida WhatsApp y Web por telefono', async () => {
  const service = new IdentityConsolidationService(
    new IdentityEngine(new InMemoryIdentityAdapter())
  );

  const first = await service.consolidate({
    channel: 'whatsapp',
    externalUserId: 'wa-1',
    phone: '+505 8111-2233'
  });

  const second = await service.consolidate({
    channel: 'web',
    externalUserId: 'web-1',
    phone: '50581112233'
  });

  assert.equal(first.identityId, second.identityId);
  assert.equal(second.merged, true);
  assert.equal(second.links.length, 2);
});
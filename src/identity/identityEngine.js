import { randomUUID } from 'node:crypto';

function requireText(value, fieldName) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new TypeError(`${fieldName} requerido`);
  }

  return value.trim();
}

function normalizePhone(value) {
  return String(value || '').replace(/\D+/g, '');
}

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

export class IdentityEngine {
  constructor(adapter) {
    if (
      !adapter ||
      typeof adapter.save !== 'function' ||
      typeof adapter.findByExternal !== 'function'
    ) {
      throw new TypeError('IdentityEngine requiere un adapter valido');
    }

    this.adapter = adapter;
  }

  resolve({
    channel,
    externalUserId,
    phone = null,
    email = null,
    displayName = null,
    metadata = {}
  } = {}) {
    const normalizedChannel = requireText(channel, 'channel').toLowerCase();
    const normalizedExternalUserId = requireText(
      externalUserId,
      'externalUserId'
    );

    const existing = this.adapter.findByExternal(
      normalizedChannel,
      normalizedExternalUserId
    );

    if (existing) {
      return Object.freeze({
        created: false,
        identity: Object.freeze(existing)
      });
    }

    const normalizedPhone = normalizePhone(phone);
    const normalizedEmail = normalizeEmail(email);

    const possibleMatch = this.adapter
      .list()
      .find((identity) => {
        const samePhone =
          normalizedPhone &&
          identity.phone &&
          identity.phone === normalizedPhone;

        const sameEmail =
          normalizedEmail &&
          identity.email &&
          identity.email === normalizedEmail;

        return samePhone || sameEmail;
      });

    if (possibleMatch) {
      const updated = {
        ...possibleMatch,
        displayName:
          possibleMatch.displayName ||
          (displayName ? String(displayName).trim() : null),
        phone: possibleMatch.phone || normalizedPhone || null,
        email: possibleMatch.email || normalizedEmail || null,
        links: [
          ...possibleMatch.links,
          {
            channel: normalizedChannel,
            externalUserId: normalizedExternalUserId
          }
        ],
        metadata: {
          ...possibleMatch.metadata,
          ...metadata
        },
        updatedAt: new Date().toISOString()
      };

      return Object.freeze({
        created: false,
        merged: true,
        identity: Object.freeze(this.adapter.save(updated))
      });
    }

    const identity = {
      identityId: randomUUID(),
      displayName: displayName ? String(displayName).trim() : null,
      phone: normalizedPhone || null,
      email: normalizedEmail || null,
      links: [
        {
          channel: normalizedChannel,
          externalUserId: normalizedExternalUserId
        }
      ],
      metadata: { ...metadata },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return Object.freeze({
      created: true,
      merged: false,
      identity: Object.freeze(this.adapter.save(identity))
    });
  }

  getById(identityId) {
    return this.adapter.getById(requireText(identityId, 'identityId'));
  }
}
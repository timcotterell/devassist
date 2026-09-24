import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createToken,
  parseBearerToken,
  verifyToken
} from '../src/auth.js';

test('creates and verifies a gateway token', () => {
  const token = createToken({
    username: 'developer',
    displayName: 'Developer',
    roles: ['support-engineer']
  });

  const payload = verifyToken(token);

  assert.equal(payload.sub, 'developer');
  assert.deepEqual(payload.roles, ['support-engineer']);
});

test('parses a valid bearer header', () => {
  assert.equal(parseBearerToken('Bearer abc123'), 'abc123');
});

test('rejects malformed bearer headers', () => {
  assert.equal(parseBearerToken('Basic abc123'), null);
  assert.equal(parseBearerToken(''), null);
});

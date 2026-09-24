import test from 'node:test';
import assert from 'node:assert/strict';
import { runDiagnostic } from '../src/diagnostics.js';

test('checkout-api surfaces the authentication failure', () => {
  const result = runDiagnostic('checkout-api');

  assert.equal(result.status, 'FAIL');
  assert.equal(result.checks.filter((check) => check.status === 'FAIL').length, 1);
  assert.equal(
    result.checks.find((check) => check.id === 'auth').status,
    'FAIL'
  );
});

test('identity-api passes the deterministic checks', () => {
  const result = runDiagnostic('identity-api');

  assert.equal(result.status, 'PASS');
  assert.ok(result.checks.every((check) => check.status === 'PASS'));
});

test('unknown services return null', () => {
  assert.equal(runDiagnostic('missing-service'), null);
});

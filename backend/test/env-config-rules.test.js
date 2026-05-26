import test from 'node:test';
import assert from 'node:assert/strict';
import { assertRequiredEnv, validateRequiredEnv } from '../src/env-config-rules.js';

test('validateRequiredEnv accepts configured required variables', () => {
  assert.deepEqual(validateRequiredEnv({ DATABASE_URL: 'postgres://db', JWT_SECRET: 'secret' }), {
    valid: true,
    missing: [],
  });
});

test('validateRequiredEnv reports missing required variables', () => {
  assert.deepEqual(validateRequiredEnv({ DATABASE_URL: 'postgres://db' }), {
    valid: false,
    message: 'JWT_SECRET é obrigatório',
    missing: ['JWT_SECRET'],
  });
});

test('validateRequiredEnv reports multiple missing variables', () => {
  assert.deepEqual(validateRequiredEnv({}), {
    valid: false,
    message: 'DATABASE_URL, JWT_SECRET é obrigatório',
    missing: ['DATABASE_URL', 'JWT_SECRET'],
  });
});

test('assertRequiredEnv throws when required variables are missing', () => {
  assert.throws(() => assertRequiredEnv({ JWT_SECRET: 'secret' }), /DATABASE_URL é obrigatório/);
});

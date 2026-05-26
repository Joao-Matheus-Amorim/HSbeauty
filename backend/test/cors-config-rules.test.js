import test from 'node:test';
import assert from 'node:assert/strict';
import { buildAllowedOrigins, isOriginAllowed } from '../src/cors-config-rules.js';

test('buildAllowedOrigins normalizes configured origins', () => {
  assert.deepEqual(buildAllowedOrigins(' http://localhost:5173, https://app.example.com ,'), [
    'http://localhost:5173',
    'https://app.example.com',
  ]);
});

test('buildAllowedOrigins falls back to the local frontend origin', () => {
  assert.deepEqual(buildAllowedOrigins(''), ['http://localhost:5173']);
  assert.deepEqual(buildAllowedOrigins(undefined), ['http://localhost:5173']);
});

test('isOriginAllowed accepts requests without origin header', () => {
  assert.equal(isOriginAllowed(undefined, ['https://app.example.com']), true);
  assert.equal(isOriginAllowed(null, ['https://app.example.com']), true);
});

test('isOriginAllowed validates explicit browser origins', () => {
  assert.equal(isOriginAllowed('https://app.example.com', ['https://app.example.com']), true);
  assert.equal(isOriginAllowed('https://other.example.com', ['https://app.example.com']), false);
});

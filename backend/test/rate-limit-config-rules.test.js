import test from 'node:test';
import assert from 'node:assert/strict';
import { buildLoginRateLimitConfig } from '../src/rate-limit-config-rules.js';

test('buildLoginRateLimitConfig preserves login limiter contract', () => {
  const config = buildLoginRateLimitConfig();

  assert.equal(config.windowMs, 15 * 60 * 1000);
  assert.equal(config.limit, 5);
  assert.equal(config.standardHeaders, 'draft-6');
  assert.deepEqual(config.message, { erro: 'Muitas tentativas de login. Tente novamente em 15 minutos.' });
});

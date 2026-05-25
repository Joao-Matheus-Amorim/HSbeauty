import test from 'node:test';
import assert from 'node:assert/strict';
import { legacyAdminRouteDeprecation } from '../src/legacy-route-deprecation.js';

function runMiddleware(method, path) {
  const headers = {};
  let nextCalled = false;

  legacyAdminRouteDeprecation(
    { method, path },
    {
      set(name, value) {
        headers[name] = value;
      },
    },
    () => {
      nextCalled = true;
    },
  );

  return { headers, nextCalled };
}

test('adds deprecation headers to protected legacy admin collection routes', () => {
  const { headers, nextCalled } = runMiddleware('GET', '/agendamentos');

  assert.equal(nextCalled, true);
  assert.equal(headers.Deprecation, 'true');
  assert.equal(headers.Sunset, 'Wed, 30 Sep 2026 23:59:59 GMT');
  assert.equal(headers['X-HSBeauty-Deprecated-Route'], 'Use the equivalent /admin route');
});

test('adds deprecation headers to protected legacy admin item routes', () => {
  const { headers } = runMiddleware('DELETE', '/bloqueios/123');

  assert.equal(headers.Deprecation, 'true');
  assert.equal(headers.Sunset, 'Wed, 30 Sep 2026 23:59:59 GMT');
  assert.equal(headers['X-HSBeauty-Deprecated-Route'], 'Use the equivalent /admin route');
});

test('does not mark public booking creation as deprecated', () => {
  const { headers, nextCalled } = runMiddleware('POST', '/agendamentos');

  assert.equal(nextCalled, true);
  assert.deepEqual(headers, {});
});

test('does not mark public service reads as deprecated', () => {
  assert.deepEqual(runMiddleware('GET', '/servicos').headers, {});
  assert.deepEqual(runMiddleware('GET', '/servicos/1').headers, {});
});

test('does not mark availability route as deprecated', () => {
  const { headers } = runMiddleware('GET', '/disponibilidade');

  assert.deepEqual(headers, {});
});

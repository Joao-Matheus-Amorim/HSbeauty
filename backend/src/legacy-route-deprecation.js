import express from 'express';

const LEGACY_ADMIN_ROUTES = new Set([
  'GET /agendamentos',
  'GET /agendamentos/:id',
  'PUT /agendamentos/:id',
  'DELETE /agendamentos/:id',
  'POST /servicos',
  'PUT /servicos/:id',
  'DELETE /servicos/:id',
  'GET /bloqueios',
  'POST /bloqueios',
  'DELETE /bloqueios/:id',
]);

function normalizeLegacyRoutePath(path) {
  if (/^\/agendamentos\/\d+$/.test(path)) return '/agendamentos/:id';
  if (/^\/servicos\/\d+$/.test(path)) return '/servicos/:id';
  if (/^\/bloqueios\/\d+$/.test(path)) return '/bloqueios/:id';
  return path;
}

function shouldMarkDeprecated(req) {
  if (!req) return false;
  const routeKey = `${req.method} ${normalizeLegacyRoutePath(req.path)}`;
  return LEGACY_ADMIN_ROUTES.has(routeKey);
}

function setDeprecationHeaders(req, res) {
  if (!shouldMarkDeprecated(req) || res.headersSent) return;
  res.set('Deprecation', 'true');
  res.set('Sunset', 'Wed, 30 Sep 2026 23:59:59 GMT');
  res.set('X-HSBeauty-Deprecated-Route', 'Use the equivalent /admin route');
}

export function legacyAdminRouteDeprecation(req, res, next) {
  setDeprecationHeaders(req, res);
  next();
}

function installLegacyRouteDeprecationPatch() {
  if (express.response.__hsBeautyLegacyDeprecationPatchInstalled) return;

  const originalJson = express.response.json;
  const originalSend = express.response.send;

  express.response.json = function jsonWithLegacyDeprecationHeaders(...args) {
    setDeprecationHeaders(this.req, this);
    return originalJson.apply(this, args);
  };

  express.response.send = function sendWithLegacyDeprecationHeaders(...args) {
    setDeprecationHeaders(this.req, this);
    return originalSend.apply(this, args);
  };

  Object.defineProperty(express.response, '__hsBeautyLegacyDeprecationPatchInstalled', {
    value: true,
    enumerable: false,
  });
}

installLegacyRouteDeprecationPatch();

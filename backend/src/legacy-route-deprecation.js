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

export function legacyAdminRouteDeprecation(req, res, next) {
  const routeKey = `${req.method} ${normalizeLegacyRoutePath(req.path)}`;

  if (LEGACY_ADMIN_ROUTES.has(routeKey)) {
    res.set('Deprecation', 'true');
    res.set('Sunset', 'Wed, 30 Sep 2026 23:59:59 GMT');
    res.set('X-HSBeauty-Deprecated-Route', 'Use the equivalent /admin route');
  }

  next();
}

export function legacyAdminRouteDeprecation(_req, res, next) {
  res.set('Deprecation', 'true');
  res.set('Sunset', 'Wed, 30 Sep 2026 23:59:59 GMT');
  res.set('X-HSBeauty-Deprecated-Route', 'Use the equivalent /admin route');
  next();
}

const DEFAULT_FRONTEND_URL = 'http://localhost:5173';

export function buildAllowedOrigins(frontendUrl = DEFAULT_FRONTEND_URL) {
  return String(frontendUrl || DEFAULT_FRONTEND_URL)
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export function isOriginAllowed(origin, allowedOrigins) {
  if (!origin) return true;
  return allowedOrigins.includes(origin);
}

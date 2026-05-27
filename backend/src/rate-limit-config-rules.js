export const LOGIN_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
export const LOGIN_RATE_LIMIT_MAX_ATTEMPTS = 5;
export const LOGIN_RATE_LIMIT_MESSAGE = 'Muitas tentativas de login. Tente novamente em 15 minutos.';

export function buildLoginRateLimitConfig() {
  return {
    windowMs: LOGIN_RATE_LIMIT_WINDOW_MS,
    limit: LOGIN_RATE_LIMIT_MAX_ATTEMPTS,
    standardHeaders: 'draft-6',
    message: { erro: LOGIN_RATE_LIMIT_MESSAGE },
  };
}

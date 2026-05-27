const LOCAL_API_URL = 'http://localhost:3000';

function normalizeApiUrl(value) {
  return typeof value === 'string' ? value.trim().replace(/\/+$/, '') : '';
}

export function resolveApiUrl({
  envUrl = import.meta.env.VITE_API_URL,
  hostname = typeof window !== 'undefined' ? window.location.hostname : '',
} = {}) {
  const configuredUrl = normalizeApiUrl(envUrl);
  const isLocalHost = ['localhost', '127.0.0.1'].includes(hostname);

  if (isLocalHost) return configuredUrl || LOCAL_API_URL;
  if (!configuredUrl || configuredUrl.includes('localhost') || configuredUrl.includes('127.0.0.1')) return '';
  return configuredUrl;
}

export const API_URL = resolveApiUrl();

export async function parseJsonResponse(response) {
  const text = await response.text();
  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
    return { erro: 'Resposta inválida do servidor' };
  }
}

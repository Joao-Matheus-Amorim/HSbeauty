const PRODUCTION_API_URL = 'https://hsbeauty.onrender.com';
const LOCAL_API_URL = 'http://localhost:3000';

function resolveApiUrl() {
  const envUrl = import.meta.env.VITE_API_URL;
  const isBrowser = typeof window !== 'undefined';
  const isLocalHost = isBrowser && ['localhost', '127.0.0.1'].includes(window.location.hostname);

  if (isLocalHost) return envUrl || LOCAL_API_URL;
  if (!envUrl || envUrl.includes('localhost') || envUrl.includes('127.0.0.1')) return PRODUCTION_API_URL;
  return envUrl;
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

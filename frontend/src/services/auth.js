import { API_URL, parseJsonResponse } from './api';

export { API_URL };

const ACCESS_TOKEN_KEY = 'hs_token';
const REFRESH_TOKEN_KEY = 'hs_refresh_token';
const ADMIN_KEY = 'hs_admin';

let refreshPromise = null;

export function getAccessToken() {
  return sessionStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken() {
  return sessionStorage.getItem(REFRESH_TOKEN_KEY);
}

export function getAdminFromSession() {
  try {
    const raw = sessionStorage.getItem(ADMIN_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setAdminSession({ accessToken, refreshToken, admin }) {
  if (!accessToken) throw new Error('accessToken ausente na resposta de login');
  if (!refreshToken) throw new Error('refreshToken ausente na resposta de login');

  sessionStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  sessionStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  if (admin) sessionStorage.setItem(ADMIN_KEY, JSON.stringify(admin));
}

export function clearAdminSession() {
  sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  sessionStorage.removeItem(REFRESH_TOKEN_KEY);
  sessionStorage.removeItem(ADMIN_KEY);
  window.dispatchEvent(new Event('hs-auth-cleared'));
}

export function getAuthHeaders() {
  const token = getAccessToken();
  return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
}

async function parseJson(response) {
  return parseJsonResponse(response);
}

export async function loginAdmin(email, senha) {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, senha }),
  });
  const json = await parseJson(response);
  if (!response.ok) throw new Error(json.erro || 'Erro ao fazer login');

  setAdminSession(json);
  return json;
}

async function refreshAdminSessionOnce() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  const response = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  const json = await parseJson(response);
  if (!response.ok) {
    clearAdminSession();
    return null;
  }

  setAdminSession({ ...json, admin: getAdminFromSession() });
  return json.accessToken;
}

export async function refreshAdminSession() {
  if (!refreshPromise) {
    refreshPromise = refreshAdminSessionOnce().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

export async function logoutAdmin() {
  const refreshToken = getRefreshToken();

  try {
    if (refreshToken) {
      await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
    }
  } finally {
    clearAdminSession();
  }
}

export async function authorizedFetch(url, options = {}) {
  const request = () => fetch(url, { ...options, headers: { ...getAuthHeaders(), ...(options.headers || {}) } });

  let response = await request();
  if (response.status !== 401) return response;

  const refreshed = await refreshAdminSession();
  if (!refreshed) return response;

  response = await request();
  if (response.status === 401) clearAdminSession();
  return response;
}

export async function handleAuthResponse(response) {
  const json = await parseJson(response);
  if (response.status === 401) clearAdminSession();
  if (!response.ok) throw new Error(json.erro || 'Erro na requisição');
  return json;
}

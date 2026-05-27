import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getAccessToken,
  getRefreshToken,
  setAdminSession,
  clearAdminSession,
  getAuthHeaders,
  getAdminFromSession,
} from '../../services/auth';

// sessionStorage mock (jsdom já tem, mas garantimos reset)
beforeEach(() => {
  sessionStorage.clear();
  vi.unstubAllGlobals();
});

// ─── setAdminSession / getAccessToken ─────────────────────────────────────────
describe('setAdminSession', () => {
  it('salva access token no sessionStorage', () => {
    setAdminSession({ accessToken: 'tok_a', refreshToken: 'tok_r' });
    expect(getAccessToken()).toBe('tok_a');
  });

  it('salva refresh token no sessionStorage', () => {
    setAdminSession({ accessToken: 'tok_a', refreshToken: 'tok_r' });
    expect(getRefreshToken()).toBe('tok_r');
  });

  it('salva dados do admin quando fornecido', () => {
    setAdminSession({ accessToken: 'tok_a', refreshToken: 'tok_r', admin: { id: 1, email: 'a@b.com' } });
    const admin = getAdminFromSession();
    expect(admin).toMatchObject({ id: 1, email: 'a@b.com' });
  });

  it('lança erro quando accessToken está ausente', () => {
    expect(() => setAdminSession({ refreshToken: 'tok_r' })).toThrow('accessToken ausente');
  });

  it('lança erro quando refreshToken está ausente', () => {
    expect(() => setAdminSession({ accessToken: 'tok_a' })).toThrow('refreshToken ausente');
  });
});

// ─── clearAdminSession ────────────────────────────────────────────────────────
describe('clearAdminSession', () => {
  it('remove os três itens do sessionStorage', () => {
    setAdminSession({ accessToken: 'tok_a', refreshToken: 'tok_r', admin: { id: 1 } });
    clearAdminSession();
    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
    expect(getAdminFromSession()).toBeNull();
  });

  it('dispara evento hs-auth-cleared na window', () => {
    const handler = vi.fn();
    window.addEventListener('hs-auth-cleared', handler);
    clearAdminSession();
    expect(handler).toHaveBeenCalledTimes(1);
    window.removeEventListener('hs-auth-cleared', handler);
  });
});

// ─── getAuthHeaders ───────────────────────────────────────────────────────────
describe('getAuthHeaders', () => {
  it('inclui Authorization Bearer quando há token', () => {
    setAdminSession({ accessToken: 'meu_token', refreshToken: 'r' });
    const headers = getAuthHeaders();
    expect(headers.Authorization).toBe('Bearer meu_token');
    expect(headers['Content-Type']).toBe('application/json');
  });

  it('não inclui Authorization quando não há token', () => {
    const headers = getAuthHeaders();
    expect(headers.Authorization).toBeUndefined();
    expect(headers['Content-Type']).toBe('application/json');
  });
});

// ─── getAdminFromSession ──────────────────────────────────────────────────────
describe('getAdminFromSession', () => {
  it('retorna null quando sessionStorage está vazio', () => {
    expect(getAdminFromSession()).toBeNull();
  });

  it('retorna null quando JSON é inválido (não crasha)', () => {
    sessionStorage.setItem('hs_admin', 'não-é-json{{{');
    expect(getAdminFromSession()).toBeNull();
  });
});

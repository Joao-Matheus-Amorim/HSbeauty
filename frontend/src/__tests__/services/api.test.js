import { describe, expect, it } from 'vitest';
import { parseJsonResponse, resolveApiUrl } from '../../services/api';

function makeResponse(text) {
  return {
    text: () => Promise.resolve(text),
  };
}

describe('resolveApiUrl', () => {
  it('uses local backend by default on localhost', () => {
    expect(resolveApiUrl({ hostname: 'localhost' })).toBe('http://localhost:3000');
  });

  it('uses configured API URL without trailing slashes', () => {
    expect(resolveApiUrl({ envUrl: 'https://api.example.com///', hostname: 'hsbeauty.vercel.app' })).toBe('https://api.example.com');
  });

  it('does not use localhost configuration on deployed hosts', () => {
    expect(resolveApiUrl({ envUrl: 'http://localhost:3000', hostname: 'hsbeauty.vercel.app' })).toBe('');
  });
});

describe('parseJsonResponse', () => {
  it('returns an empty object for empty responses', async () => {
    await expect(parseJsonResponse(makeResponse(''))).resolves.toEqual({});
  });

  it('returns a public error for invalid JSON', async () => {
    await expect(parseJsonResponse(makeResponse('<html>erro</html>'))).resolves.toEqual({
      erro: 'Resposta inválida do servidor',
    });
  });
});

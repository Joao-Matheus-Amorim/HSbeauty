import test from 'node:test';
import assert from 'node:assert/strict';
import { validateImagemUrl } from '../src/url-rules.js';

test('validateImagemUrl aceita http e https', () => {
  assert.deepEqual(validateImagemUrl('https://cdn.example.com/img.png'), {
    valid: true, value: 'https://cdn.example.com/img.png',
  });
  assert.deepEqual(validateImagemUrl('http://cdn.example.com/img.png'), {
    valid: true, value: 'http://cdn.example.com/img.png',
  });
});

test('validateImagemUrl normaliza espacos', () => {
  const result = validateImagemUrl('  https://cdn.example.com/img.png  ');
  assert.equal(result.valid, true);
  assert.equal(result.value, 'https://cdn.example.com/img.png');
});

test('validateImagemUrl rejeita javascript:', () => {
  assert.deepEqual(validateImagemUrl('javascript:alert(1)'), {
    valid: false, status: 400,
    message: 'imagemUrl deve ser uma URL http(s) ou data URI de imagem',
  });
});

test('validateImagemUrl rejeita strings nao-url', () => {
  assert.equal(validateImagemUrl('nao-e-url').valid, false);
});

test('validateImagemUrl aceita data URI de imagem', () => {
  const data = 'data:image/png;base64,iVBORw0KGgo=';
  const result = validateImagemUrl(data);
  assert.equal(result.valid, true);
  assert.equal(result.value, data);
});

test('validateImagemUrl rejeita data URI nao-imagem', () => {
  assert.equal(validateImagemUrl('data:text/html;base64,PHN2Zw==').valid, false);
});

test('validateImagemUrl rejeita data URI acima de 2MB', () => {
  const huge = 'data:image/png;base64,' + 'A'.repeat(1024 * 1024 * 2 + 100);
  const result = validateImagemUrl(huge);
  assert.equal(result.valid, false);
  assert.equal(result.message, 'Imagem em data URI excede 2MB');
});

test('validateImagemUrl rejeita URL acima de 500 chars', () => {
  const url = 'https://example.com/' + 'a'.repeat(500);
  const result = validateImagemUrl(url);
  assert.equal(result.valid, false);
  assert.match(result.message, /excede 500/);
});

test('validateImagemUrl aceita null e string vazia para limpar campo', () => {
  assert.deepEqual(validateImagemUrl(null), { valid: true, value: null });
  assert.deepEqual(validateImagemUrl(''), { valid: true, value: null });
});

test('validateImagemUrl deixa undefined intocado (campo nao informado)', () => {
  assert.deepEqual(validateImagemUrl(undefined), { valid: true, value: undefined });
});

test('validateImagemUrl rejeita tipos nao-string', () => {
  assert.equal(validateImagemUrl(123).valid, false);
  assert.equal(validateImagemUrl({}).valid, false);
});

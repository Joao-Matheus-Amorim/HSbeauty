import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateAdminCategoriaCreatePayload,
  validateAdminCategoriaUpdatePayload,
} from '../src/admin-categoria-mutation-rules.js';

test('validateAdminCategoriaCreatePayload normalizes valid payloads', () => {
  assert.deepEqual(
    validateAdminCategoriaCreatePayload({
      nome: '  Unhas  ',
      imagemUrl: '  https://cdn.example.com/img.png  ',
      ordem: '2',
      ativo: false,
    }),
    {
      valid: true,
      data: { nome: 'Unhas', imagemUrl: 'https://cdn.example.com/img.png', ordem: 2, ativo: false },
    },
  );
});

test('validateAdminCategoriaCreatePayload defaults ordem and ativo', () => {
  assert.deepEqual(validateAdminCategoriaCreatePayload({ nome: 'Cílios' }), {
    valid: true,
    data: { nome: 'Cílios', ordem: 0, ativo: true },
  });
});

test('validateAdminCategoriaCreatePayload requires nome', () => {
  assert.deepEqual(validateAdminCategoriaCreatePayload({}), {
    valid: false,
    status: 400,
    message: 'Nome da categoria é obrigatório',
  });

  assert.deepEqual(validateAdminCategoriaCreatePayload({ nome: '   ' }), {
    valid: false,
    status: 400,
    message: 'Nome da categoria é obrigatório',
  });
});

test('validateAdminCategoriaCreatePayload rejects nome muito longo', () => {
  const longName = 'A'.repeat(61);
  assert.deepEqual(validateAdminCategoriaCreatePayload({ nome: longName }), {
    valid: false,
    status: 400,
    message: 'Nome excede 60 caracteres',
  });
});

test('validateAdminCategoriaCreatePayload rejects URL maliciosa', () => {
  assert.deepEqual(validateAdminCategoriaCreatePayload({ nome: 'X', imagemUrl: 'javascript:alert(1)' }), {
    valid: false,
    status: 400,
    message: 'imagemUrl deve ser uma URL http(s) ou data URI de imagem',
  });
});

test('validateAdminCategoriaCreatePayload aceita data URI de imagem', () => {
  const dataUri = 'data:image/png;base64,iVBORw0KGgo=';
  const result = validateAdminCategoriaCreatePayload({ nome: 'X', imagemUrl: dataUri });
  assert.equal(result.valid, true);
  assert.equal(result.data.imagemUrl, dataUri);
});

test('validateAdminCategoriaCreatePayload rejects ordem negativa', () => {
  assert.deepEqual(validateAdminCategoriaCreatePayload({ nome: 'X', ordem: -1 }), {
    valid: false,
    status: 400,
    message: 'Ordem deve ser inteiro >= 0',
  });
});

test('validateAdminCategoriaUpdatePayload aceita imagemUrl null para remover', () => {
  assert.deepEqual(validateAdminCategoriaUpdatePayload({ imagemUrl: null }), {
    valid: true,
    data: { imagemUrl: null },
  });
});

test('validateAdminCategoriaUpdatePayload rejects update vazio', () => {
  assert.deepEqual(validateAdminCategoriaUpdatePayload({}), {
    valid: false,
    status: 400,
    message: 'Nenhum campo para atualizar',
  });
});

test('validateAdminCategoriaUpdatePayload rejects nome vazio explicito', () => {
  assert.deepEqual(validateAdminCategoriaUpdatePayload({ nome: '' }), {
    valid: false,
    status: 400,
    message: 'Nome inválido',
  });
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateAdminServiceCreatePayload,
  validateAdminServiceUpdatePayload,
} from '../src/admin-service-mutation-rules.js';

test('validateAdminServiceCreatePayload normalizes valid payloads', () => {
  assert.deepEqual(
    validateAdminServiceCreatePayload({
      nome: '  Design de Sobrancelhas  ',
      preco: '80.50',
      duracao: '45',
      descricao: '  Serviço completo  ',
      categoriaId: 7,
      ativo: false,
    }),
    {
      valid: true,
      data: {
        nome: 'Design de Sobrancelhas',
        preco: 80.5,
        duracao: 45,
        descricao: 'Serviço completo',
        categoriaId: 7,
        ativo: false,
      },
    },
  );
});

test('validateAdminServiceCreatePayload defaults active to true', () => {
  assert.deepEqual(validateAdminServiceCreatePayload({ nome: 'Unha', preco: 50, duracao: 60, categoriaId: 3 }), {
    valid: true,
    data: {
      nome: 'Unha',
      preco: 50,
      duracao: 60,
      categoriaId: 3,
      ativo: true,
    },
  });
});

test('validateAdminServiceCreatePayload rejects missing required fields', () => {
  assert.deepEqual(validateAdminServiceCreatePayload({ preco: 50, duracao: 60 }), {
    valid: false,
    status: 400,
    message: 'Nome é obrigatório',
  });

  assert.deepEqual(validateAdminServiceCreatePayload({ nome: 'Unha', duracao: 60 }), {
    valid: false,
    status: 400,
    message: 'Preço é obrigatório',
  });

  assert.deepEqual(validateAdminServiceCreatePayload({ nome: 'Unha', preco: 50 }), {
    valid: false,
    status: 400,
    message: 'Duração é obrigatória',
  });

  assert.deepEqual(validateAdminServiceCreatePayload({ nome: 'Unha', preco: 50, duracao: 60 }), {
    valid: false,
    status: 400,
    message: 'Categoria é obrigatória',
  });

  assert.deepEqual(validateAdminServiceCreatePayload({ nome: 'Unha', preco: 50, duracao: 60, categoriaId: 'abc' }), {
    valid: false,
    status: 400,
    message: 'Categoria inválida',
  });

  assert.deepEqual(validateAdminServiceCreatePayload({ nome: 'Unha', preco: 50, duracao: 60, categoriaId: 0 }), {
    valid: false,
    status: 400,
    message: 'Categoria inválida',
  });
});

test('validateAdminServiceCreatePayload rejects invalid numeric fields', () => {
  assert.deepEqual(validateAdminServiceCreatePayload({ nome: 'Unha', preco: 0, duracao: 60 }), {
    valid: false,
    status: 400,
    message: 'Preço inválido',
  });

  assert.deepEqual(validateAdminServiceCreatePayload({ nome: 'Unha', preco: 50, duracao: 1.5 }), {
    valid: false,
    status: 400,
    message: 'Duração inválida',
  });
});

test('validateAdminServiceCreatePayload rejects invalid optional field types', () => {
  assert.deepEqual(validateAdminServiceCreatePayload({ nome: 'Unha', preco: 50, duracao: 60, categoriaId: 3, descricao: 123 }), {
    valid: false,
    status: 400,
    message: 'descricao deve ser texto',
  });

  assert.deepEqual(validateAdminServiceCreatePayload({ nome: 'Unha', preco: 50, duracao: 60, categoriaId: 3, ativo: 'true' }), {
    valid: false,
    status: 400,
    message: 'Ativo deve ser true ou false',
  });
});

test('validateAdminServiceUpdatePayload normalizes valid updates', () => {
  assert.deepEqual(
    validateAdminServiceUpdatePayload({
      nome: '  Brow Lamination  ',
      preco: '120',
      duracao: '90',
      descricao: '',
      categoriaId: 7,
      ativo: true,
    }),
    {
      valid: true,
      data: {
        nome: 'Brow Lamination',
        preco: 120,
        duracao: 90,
        descricao: null,
        categoriaId: 7,
        ativo: true,
      },
    },
  );
});

test('validateAdminServiceUpdatePayload rejects invalid updates', () => {
  assert.deepEqual(validateAdminServiceUpdatePayload({ nome: '' }), {
    valid: false,
    status: 400,
    message: 'Nome inválido',
  });

  assert.deepEqual(validateAdminServiceUpdatePayload({ preco: -1 }), {
    valid: false,
    status: 400,
    message: 'Preço inválido',
  });

  assert.deepEqual(validateAdminServiceUpdatePayload({ duracao: 'x' }), {
    valid: false,
    status: 400,
    message: 'Duração inválida',
  });

  assert.deepEqual(validateAdminServiceUpdatePayload({ ativo: 'false' }), {
    valid: false,
    status: 400,
    message: 'Ativo deve ser true ou false',
  });

  assert.deepEqual(validateAdminServiceUpdatePayload({ categoriaId: null }), {
    valid: false,
    status: 400,
    message: 'Categoria é obrigatória',
  });

  assert.deepEqual(validateAdminServiceUpdatePayload({ categoriaId: 'abc' }), {
    valid: false,
    status: 400,
    message: 'Categoria inválida',
  });
});

test('validateAdminServiceUpdatePayload rejects empty updates', () => {
  assert.deepEqual(validateAdminServiceUpdatePayload({}), {
    valid: false,
    status: 400,
    message: 'Nenhum campo para atualizar',
  });
});

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
      categoria: '  Sobrancelhas  ',
      ativo: false,
    }),
    {
      valid: true,
      data: {
        nome: 'Design de Sobrancelhas',
        preco: 80.5,
        duracao: 45,
        descricao: 'Serviço completo',
        categoria: 'Sobrancelhas',
        ativo: false,
      },
    },
  );
});

test('validateAdminServiceCreatePayload defaults active to true', () => {
  assert.deepEqual(validateAdminServiceCreatePayload({ nome: 'Unha', preco: 50, duracao: 60 }), {
    valid: true,
    data: {
      nome: 'Unha',
      preco: 50,
      duracao: 60,
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
  assert.deepEqual(validateAdminServiceCreatePayload({ nome: 'Unha', preco: 50, duracao: 60, descricao: 123 }), {
    valid: false,
    status: 400,
    message: 'descricao deve ser texto',
  });

  assert.deepEqual(validateAdminServiceCreatePayload({ nome: 'Unha', preco: 50, duracao: 60, ativo: 'true' }), {
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
      categoria: null,
      ativo: true,
    }),
    {
      valid: true,
      data: {
        nome: 'Brow Lamination',
        preco: 120,
        duracao: 90,
        descricao: null,
        categoria: null,
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
});

test('validateAdminServiceUpdatePayload rejects empty updates', () => {
  assert.deepEqual(validateAdminServiceUpdatePayload({}), {
    valid: false,
    status: 400,
    message: 'Nenhum campo para atualizar',
  });
});

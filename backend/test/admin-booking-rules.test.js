import test from 'node:test';
import assert from 'node:assert/strict';
import { validateAdminBookingUpdatePayload } from '../src/admin-booking-rules.js';

test('validateAdminBookingUpdatePayload normalizes valid admin updates', () => {
  const result = validateAdminBookingUpdatePayload({
    status: 'confirmado',
    observacoes: '  Cliente confirmou por WhatsApp  ',
    nomeCliente: '  Maria  ',
    telefone: ' (11) 98765-4321 ',
    email: 'maria@example.com',
  });

  assert.equal(result.valid, true);
  assert.deepEqual(result.data, {
    status: 'confirmado',
    observacoes: 'Cliente confirmou por WhatsApp',
    nomeCliente: 'Maria',
    telefone: '(11) 98765-4321',
    email: 'maria@example.com',
  });
});

test('validateAdminBookingUpdatePayload accepts null observations', () => {
  assert.deepEqual(validateAdminBookingUpdatePayload({ observacoes: null }), {
    valid: true,
    data: { observacoes: null },
  });
});

test('validateAdminBookingUpdatePayload rejects invalid status', () => {
  assert.deepEqual(validateAdminBookingUpdatePayload({ status: 'aprovado' }), {
    valid: false,
    status: 400,
    message: 'Status inválido',
  });
});

test('validateAdminBookingUpdatePayload rejects invalid phone', () => {
  assert.deepEqual(validateAdminBookingUpdatePayload({ telefone: '123' }), {
    valid: false,
    status: 400,
    message: 'Telefone inválido. Use o formato (11) 98765-4321 ou similar.',
  });
});

test('validateAdminBookingUpdatePayload rejects non-text observations', () => {
  assert.deepEqual(validateAdminBookingUpdatePayload({ observacoes: 123 }), {
    valid: false,
    status: 400,
    message: 'Observações deve ser texto',
  });
});

test('validateAdminBookingUpdatePayload rejects oversized observations', () => {
  const result = validateAdminBookingUpdatePayload({ observacoes: 'a'.repeat(501) });

  assert.deepEqual(result, {
    valid: false,
    status: 400,
    message: 'Observações excedem o limite de 500 caracteres',
  });
});

test('validateAdminBookingUpdatePayload rejects empty updates', () => {
  assert.deepEqual(validateAdminBookingUpdatePayload({}), {
    valid: false,
    status: 400,
    message: 'Nenhum campo para atualizar',
  });
});

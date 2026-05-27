import test from 'node:test';
import assert from 'node:assert/strict';
import { validateAppointmentUpdatePayload } from '../src/appointment-mutation-rules.js';

test('validateAppointmentUpdatePayload normalizes valid updates', () => {
  const result = validateAppointmentUpdatePayload({
    nomeCliente: '  Maria  ',
    telefone: ' (11) 98765-4321 ',
    data: '2026-05-25T09:30:00.000',
    servicoId: '7',
    status: 'confirmado',
    observacoes: '  Cliente confirmou  ',
  });

  assert.equal(result.valid, true);
  assert.equal(result.data.nomeCliente, 'Maria');
  assert.equal(result.data.telefone, '(11) 98765-4321');
  assert.equal(result.data.data.toISOString(), new Date('2026-05-25T09:30:00.000').toISOString());
  assert.equal(result.data.hora, '09:30');
  assert.equal(result.data.status, 'confirmado');
  assert.equal(result.data.observacoes, 'Cliente confirmou');
  assert.equal(result.dataAgendamento.toISOString(), new Date('2026-05-25T09:30:00.000').toISOString());
  assert.equal(result.servicoIdNumero, 7);
});

test('validateAppointmentUpdatePayload accepts null observations', () => {
  assert.deepEqual(validateAppointmentUpdatePayload({ observacoes: null }), {
    valid: true,
    data: { observacoes: null },
    dataAgendamento: undefined,
    servicoIdNumero: undefined,
  });
});

test('validateAppointmentUpdatePayload rejects invalid customer name', () => {
  assert.deepEqual(validateAppointmentUpdatePayload({ nomeCliente: '' }), {
    valid: false,
    status: 400,
    message: 'Nome do cliente inválido',
  });
});

test('validateAppointmentUpdatePayload rejects invalid phone', () => {
  assert.deepEqual(validateAppointmentUpdatePayload({ telefone: '123' }), {
    valid: false,
    status: 400,
    message: 'Telefone inválido. Use o formato (11) 98765-4321 ou similar.',
  });
});

test('validateAppointmentUpdatePayload rejects invalid observations', () => {
  assert.deepEqual(validateAppointmentUpdatePayload({ observacoes: 123 }), {
    valid: false,
    status: 400,
    message: 'Observações deve ser texto',
  });

  assert.deepEqual(validateAppointmentUpdatePayload({ observacoes: 'a'.repeat(501) }), {
    valid: false,
    status: 400,
    message: 'Observações excedem o limite de 500 caracteres',
  });
});

test('validateAppointmentUpdatePayload rejects invalid dates', () => {
  assert.deepEqual(validateAppointmentUpdatePayload({ data: 'x' }), {
    valid: false,
    status: 400,
    message: 'Data inválida',
  });

  assert.deepEqual(validateAppointmentUpdatePayload({ data: '' }), {
    valid: false,
    status: 400,
    message: 'Data inválida',
  });
});

test('validateAppointmentUpdatePayload rejects unaligned slot times', () => {
  assert.deepEqual(validateAppointmentUpdatePayload({ data: '2026-05-25T09:15:00.000' }), {
    valid: false,
    status: 400,
    message: 'Horário deve estar alinhado ao intervalo de 30 minutos',
  });
});

test('validateAppointmentUpdatePayload rejects invalid service id', () => {
  assert.deepEqual(validateAppointmentUpdatePayload({ servicoId: 'x' }), {
    valid: false,
    status: 400,
    message: 'Serviço inválido',
  });
});

test('validateAppointmentUpdatePayload accepts canonical completed status', () => {
  const result = validateAppointmentUpdatePayload({ status: 'concluido' });

  assert.equal(result.valid, true);
  assert.equal(result.data.status, 'concluido');
});

test('validateAppointmentUpdatePayload normalizes legacy completed status', () => {
  const result = validateAppointmentUpdatePayload({ status: 'concluído' });

  assert.equal(result.valid, true);
  assert.equal(result.data.status, 'concluido');
});

test('validateAppointmentUpdatePayload rejects invalid status', () => {
  assert.deepEqual(validateAppointmentUpdatePayload({ status: 'aprovado' }), {
    valid: false,
    status: 400,
    message: 'Status inválido',
  });
});

test('validateAppointmentUpdatePayload rejects empty updates', () => {
  assert.deepEqual(validateAppointmentUpdatePayload({}), {
    valid: false,
    status: 400,
    message: 'Nenhum campo para atualizar',
  });
});

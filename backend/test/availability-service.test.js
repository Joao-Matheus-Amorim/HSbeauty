import test from 'node:test';
import assert from 'node:assert/strict';
import { buildAvailableSlots, calculateAvailability, getDayOccupancy } from '../src/availability-service.js';

test('buildAvailableSlots returns business-hour slots excluding conflicts', () => {
  const baseDay = new Date('2026-05-25T00:00:00');
  const servico = { duracao: 60 };
  const ocupados = [
    {
      inicio: new Date('2026-05-25T10:00:00'),
      fim: new Date('2026-05-25T11:00:00'),
    },
  ];

  const slots = buildAvailableSlots(baseDay, servico, ocupados);

  assert.equal(slots.length, 14);
  assert.equal(slots[0].horario, '09:00');
  assert.equal(slots.at(-1).horario, '17:00');
  assert.equal(slots.some((slot) => slot.horario === '09:30'), false);
  assert.equal(slots.some((slot) => slot.horario === '10:00'), false);
  assert.equal(slots.some((slot) => slot.horario === '10:30'), false);
});

test('getDayOccupancy loads appointments and blocks for the requested day', async () => {
  const calls = [];
  const prisma = {
    agendamento: {
      async findMany(input) {
        calls.push({ model: 'agendamento', input });
        return [
          {
            id: 10,
            data: new Date('2026-05-25T09:00:00'),
            servico: { duracao: 60 },
          },
        ];
      },
    },
    bloqueioHorario: {
      async findMany(input) {
        calls.push({ model: 'bloqueioHorario', input });
        return [
          {
            id: 20,
            dataInicio: new Date('2026-05-25T13:00:00'),
            dataFim: new Date('2026-05-25T14:00:00'),
          },
        ];
      },
    },
  };

  const occupancy = await getDayOccupancy({ prisma, dateString: '2026-05-25' });

  assert.equal(calls.length, 2);
  assert.equal(occupancy.ocupados.length, 2);
  assert.deepEqual(
    occupancy.ocupados.map((item) => ({ tipo: item.tipo, id: item.id })),
    [
      { tipo: 'agendamento', id: 10 },
      { tipo: 'bloqueio', id: 20 },
    ],
  );
  assert.equal(occupancy.ocupados[0].fim.toISOString(), new Date('2026-05-25T10:00:00').toISOString());
});

test('calculateAvailability returns empty slots outside the current week without querying occupancy', async () => {
  const prisma = {
    agendamento: {
      async findMany() {
        throw new Error('should not query appointments outside current week');
      },
    },
    bloqueioHorario: {
      async findMany() {
        throw new Error('should not query blocks outside current week');
      },
    },
  };

  const availability = await calculateAvailability({
    prisma,
    dateString: '2026-06-01',
    servico: { duracao: 60 },
    referenceDate: new Date('2026-05-25T12:00:00'),
  });

  assert.deepEqual(availability, {
    expediente: { inicio: '09:00', fim: '18:00' },
    semanaAtual: { inicio: '2026-05-25', fim: '2026-05-31' },
    duracaoServicoMinutos: 60,
    total: 0,
    slotsDisponiveis: [],
    mensagem: 'Agendamentos disponíveis apenas para a semana atual.',
  });
});

test('calculateAvailability returns available slots for dates inside the current week', async () => {
  const prisma = {
    agendamento: {
      async findMany() {
        return [];
      },
    },
    bloqueioHorario: {
      async findMany() {
        return [];
      },
    },
  };

  const availability = await calculateAvailability({
    prisma,
    dateString: '2026-05-25',
    servico: { duracao: 60 },
    referenceDate: new Date('2026-05-25T12:00:00'),
  });

  assert.equal(availability.total, 17);
  assert.equal(availability.slotsDisponiveis[0].horario, '09:00');
  assert.equal(availability.slotsDisponiveis.at(-1).horario, '17:00');
  assert.deepEqual(availability.semanaAtual, { inicio: '2026-05-25', fim: '2026-05-31' });
});

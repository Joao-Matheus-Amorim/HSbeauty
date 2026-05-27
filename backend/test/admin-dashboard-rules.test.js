import test from 'node:test';
import assert from 'node:assert/strict';
import { buildStatusCount, calculateRevenue } from '../src/admin-dashboard-rules.js';

test('buildStatusCount counts dashboard statuses', () => {
  const rows = [
    { status: 'pendente' },
    { status: 'confirmado' },
    { status: 'cancelado' },
    { status: 'concluido' },
    { status: 'concluído' },
  ];

  assert.deepEqual(buildStatusCount(rows), {
    pendente: 1,
    confirmado: 1,
    cancelado: 1,
    concluido: 2,
  });
});

test('calculateRevenue sums only confirmed and completed appointments', () => {
  const rows = [
    { status: 'confirmado', servico: { preco: 50 } },
    { status: 'concluido', servico: { preco: 20.25 } },
    { status: 'concluído', servico: { preco: 20.25 } },
    { status: 'cancelado', servico: { preco: 999 } },
  ];

  assert.equal(calculateRevenue(rows), 90.5);
});

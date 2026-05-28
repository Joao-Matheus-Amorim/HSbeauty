import { describe, beforeEach, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AppRoutes from '../../AppRoutes';

vi.mock('../../services/agendamentos', () => ({
  listarServicos: vi.fn(),
  listarCombos: vi.fn(),
  buscarDisponibilidade: vi.fn(),
  criarAgendamento: vi.fn(),
}));

vi.mock('../../utils/date-utils', async () => {
  const actual = await vi.importActual('../../utils/date-utils');
  return {
    ...actual,
    getAvailableDays: () => ({
      days: [{ value: '2026-05-27', weekday: 'Qua', dayMonth: '27/05', weekIndex: 0 }],
      min: '2026-05-27',
      max: '2026-05-27',
    }),
  };
});

import { listarServicos, listarCombos, buscarDisponibilidade, criarAgendamento } from '../../services/agendamentos';

describe('Smoke publico', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    listarCombos.mockResolvedValue([]);
    listarServicos.mockResolvedValue([
      { id: 1, nome: 'Unhas', duracao: 60, preco: 60 },
      { id: 2, nome: 'Cilios', duracao: 30, preco: 50 },
      { id: 3, nome: 'Sobrancelhas', duracao: 40, preco: 45 },
      { id: 4, nome: 'Depilacao', duracao: 20, preco: 35 },
    ]);

    buscarDisponibilidade.mockResolvedValue({
      slotsDisponiveis: [
        { inicio: '2026-05-27T09:00:00.000Z', horario: '09:00' },
        { inicio: '2026-05-27T10:00:00.000Z', horario: '10:00' },
      ],
    });

    criarAgendamento.mockResolvedValue({
      id: 10,
      nomeCliente: 'Maria',
      telefone: '21999998888',
      data: '2026-05-27T09:00:00.000Z',
      servico: { id: 1, nome: 'Unhas', duracao: 60, preco: 60 },
      status: 'pendente',
    });
  });

  it('executa o fluxo publico de agendamento ate confirmacao', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <AppRoutes />
      </MemoryRouter>
    );

    fireEvent.click(await screen.findByRole('button', { name: /agendar/i }));
    fireEvent.click(await screen.findByRole('button', { name: /reservar unhas/i }));
    fireEvent.click(await screen.findByRole('button', { name: /27\/05/i }));
    fireEvent.click(await screen.findByRole('button', { name: /ver/i }));
    fireEvent.click(await screen.findByRole('button', { name: '09:00' }));
    fireEvent.click(await screen.findByRole('button', { name: /continuar/i }));

    fireEvent.change(await screen.findByPlaceholderText('Maria da Silva'), { target: { value: 'Maria' } });
    fireEvent.change(await screen.findByPlaceholderText('(21) 99999-9999'), { target: { value: '21999998888' } });
    fireEvent.click(await screen.findByRole('button', { name: /confirmar/i }));

    expect(await screen.findByText(/agendamento confirmado/i)).toBeInTheDocument();
    expect(await screen.findByText('Maria')).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: /confirmar pelo whatsapp/i })).toBeInTheDocument();
    expect(criarAgendamento).toHaveBeenCalledWith({
      nomeCliente: 'Maria',
      telefone: '21999998888',
      data: '2026-05-27T09:00:00.000Z',
      servicoId: 1,
    });
  });
});

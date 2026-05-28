import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AgendamentoModal from '../../components/AgendamentoModal';

vi.mock('../../services/agendamentos', () => ({
  listarServicos: vi.fn(),
  listarCombos: vi.fn(),
  buscarDisponibilidade: vi.fn(),
  criarAgendamento: vi.fn(),
}));

import { listarServicos, listarCombos, buscarDisponibilidade, criarAgendamento } from '../../services/agendamentos';

const SERVICO_MOCK = { id: 1, nome: 'Cílios', preco: 140, duracao: 90, ativo: true };
const SLOT_MOCK = { horario: '09:00', inicio: '2026-05-27T09:00:00.000Z', fim: '2026-05-27T10:30:00.000Z' };

beforeEach(() => {
  vi.clearAllMocks();
  listarServicos.mockResolvedValue([SERVICO_MOCK]);
  listarCombos.mockResolvedValue([]);
  buscarDisponibilidade.mockResolvedValue({ slotsDisponiveis: [SLOT_MOCK] });
  criarAgendamento.mockResolvedValue({
    id: 1,
    nomeCliente: 'Maria',
    data: '2026-05-27T09:00:00.000Z',
    status: 'pendente',
    servico: SERVICO_MOCK,
  });
});

describe('AgendamentoModal — renderização inicial', () => {
  it('exibe o título "Escolha seu horário"', async () => {
    render(<AgendamentoModal onClose={() => {}} />);
    expect(await screen.findByText('Escolha seu horário')).toBeInTheDocument();
  });

  it('carrega serviços da API e exibe seus nomes', async () => {
    render(<AgendamentoModal onClose={() => {}} />);

    await waitFor(() => {
      expect(listarServicos).toHaveBeenCalledWith({ ativo: true });
    });

    expect(await screen.findByRole('button', { name: /cílios/i })).toBeInTheDocument();
  });

  it('exibe mais de uma semana na lista de dias', async () => {
    render(<AgendamentoModal onClose={() => {}} />);
    await waitFor(() => expect(listarServicos).toHaveBeenCalled());

    const weekDayButtons = screen.getAllByRole('button', { name: /seg|ter|qua|qui|sex|sáb|dom/i });
    expect(weekDayButtons.length).toBeGreaterThan(7);
  });
});

describe('AgendamentoModal — duração dinâmica', () => {
  it('exibe a duração real do serviço (90 min = 1h30min), não "2h30"', async () => {
    render(<AgendamentoModal servicoInicial={SERVICO_MOCK} onClose={() => {}} />);
    await waitFor(() => expect(listarServicos).toHaveBeenCalled());

    const dayButtons = screen.getAllByRole('button', { name: /\d{2}\/\d{2}/ });
    fireEvent.click(dayButtons[0]);

    fireEvent.click(screen.getByText('Ver horários'));
    expect(await screen.findByText(/1h30min/i)).toBeInTheDocument();
    expect(screen.queryByText('2h30')).not.toBeInTheDocument();
  });
});

describe('AgendamentoModal — fechar', () => {
  it('chama onClose ao clicar no botao fechar', async () => {
    const onClose = vi.fn();
    render(<AgendamentoModal onClose={onClose} />);
    await screen.findByText('Escolha seu horário');
    fireEvent.click(screen.getByLabelText('Fechar'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

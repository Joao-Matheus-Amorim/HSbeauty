import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AgendamentoModal from '../../components/AgendamentoModal';

// Mock dos serviços
vi.mock('../../services/agendamentos', () => ({
  listarServicos: vi.fn(),
  buscarDisponibilidade: vi.fn(),
  criarAgendamento: vi.fn(),
}));

import { listarServicos, buscarDisponibilidade, criarAgendamento } from '../../services/agendamentos';

const SERVICO_MOCK = { id: 1, nome: 'Cílios', preco: 140, duracao: 90, ativo: true };
const SLOT_MOCK = { horario: '09:00', inicio: '2026-05-27T09:00:00.000Z', fim: '2026-05-27T10:30:00.000Z' };

beforeEach(() => {
  vi.clearAllMocks();
  listarServicos.mockResolvedValue([SERVICO_MOCK]);
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
    expect(await screen.findByText('Cílios')).toBeInTheDocument();
  });

  it('exibe mais de uma semana na lista de dias', async () => {
    render(<AgendamentoModal onClose={() => {}} />);
    await screen.findByText('Cílios'); // aguarda serviços carregarem

    // Com SEMANAS_DISPONIVEIS = 3, deve haver dias de semanas diferentes
    const weekDayButtons = screen.getAllByRole('button', { name: /seg|ter|qua|qui|sex|sáb|dom/i });
    expect(weekDayButtons.length).toBeGreaterThan(7);
  });
});

describe('AgendamentoModal — duração dinâmica', () => {
  it('exibe a duração real do serviço (90 min = 1h30min), não "2h30"', async () => {
    render(<AgendamentoModal servicoInicial={SERVICO_MOCK} onClose={() => {}} />);
    await screen.findByText('Cílios');

    // Seleciona um dia qualquer para avançar
    const dayButtons = screen.getAllByRole('button', { name: /\d{2}\/\d{2}/ });
    fireEvent.click(dayButtons[0]);

    fireEvent.click(screen.getByText('Ver horários'));
    await screen.findByText(/1h30min/i);

    // Garante que NÃO aparece o texto hardcoded antigo
    expect(screen.queryByText('2h30')).not.toBeInTheDocument();
  });
});

describe('AgendamentoModal — fechar', () => {
  it('chama onClose ao clicar no botão ✕', async () => {
    const onClose = vi.fn();
    render(<AgendamentoModal onClose={onClose} />);
    await screen.findByText('Escolha seu horário');
    fireEvent.click(screen.getByLabelText('Fechar'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

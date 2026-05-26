import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import AppointmentManager from '../../components/AppointmentManager';
import { STATUS } from '../../constants';

vi.mock('../../services/admin', () => ({
  listarAgendamentosAdmin: vi.fn(),
  atualizarAgendamentoAdmin: vi.fn(),
  cancelarAgendamentoAdmin: vi.fn(),
}));

import { listarAgendamentosAdmin, atualizarAgendamentoAdmin, cancelarAgendamentoAdmin } from '../../services/admin';

const AGENDAMENTO_PENDENTE = {
  id: 1,
  nomeCliente: 'Ana Lima',
  telefone: '21999887766',
  data: '2026-05-27T09:00:00.000Z',
  hora: '09:00',
  status: STATUS.PENDENTE,
  servico: { id: 1, nome: 'Unhas', preco: 35 },
};

const AGENDAMENTO_CONFIRMADO = {
  ...AGENDAMENTO_PENDENTE,
  id: 2,
  nomeCliente: 'Bia Costa',
  status: STATUS.CONFIRMADO,
};

beforeEach(() => {
  vi.clearAllMocks();
  listarAgendamentosAdmin.mockResolvedValue({
    agendamentos: [AGENDAMENTO_PENDENTE],
    paginacao: { pagina: 1, totalPaginas: 1 },
  });
});

describe('AppointmentManager — renderização', () => {
  it('exibe nome do cliente depois de carregar', async () => {
    render(<AppointmentManager />);
    expect(await screen.findByText('Ana Lima')).toBeInTheDocument();
  });

  it('exibe serviço do agendamento', async () => {
    render(<AppointmentManager />);
    expect(await screen.findByText('Unhas')).toBeInTheDocument();
  });
});

describe('AppointmentManager — status sem acento', () => {
  it('envia "concluido" (sem acento) ao concluir agendamento confirmado', async () => {
    listarAgendamentosAdmin.mockResolvedValue({
      agendamentos: [AGENDAMENTO_CONFIRMADO],
      paginacao: { pagina: 1, totalPaginas: 1 },
    });
    atualizarAgendamentoAdmin.mockResolvedValue({ ...AGENDAMENTO_CONFIRMADO, status: STATUS.CONCLUIDO });

    render(<AppointmentManager />);
    const concluirBtn = await screen.findByRole('button', { name: /concluir/i });
    fireEvent.click(concluirBtn);

    await waitFor(() => {
      expect(atualizarAgendamentoAdmin).toHaveBeenCalledWith(2, { status: 'concluido' });
      // Garante sem acento
      const [, payload] = atualizarAgendamentoAdmin.mock.calls[0];
      expect(payload.status).not.toContain('í');
    });
  });
});

describe('AppointmentManager — sem alert() / confirm()', () => {
  it('não usa window.alert — exibe erro inline', async () => {
    const alertSpy = vi.spyOn(window, 'alert');
    atualizarAgendamentoAdmin.mockRejectedValue(new Error('Falha de rede'));

    render(<AppointmentManager />);
    const confirmarBtn = await screen.findByRole('button', { name: /confirmar/i });
    fireEvent.click(confirmarBtn);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(alertSpy).not.toHaveBeenCalled();
    });
    alertSpy.mockRestore();
  });

  it('mostra confirmação inline ao cancelar (sem window.confirm)', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm');
    render(<AppointmentManager />);
    const cancelarBtn = await screen.findByRole('button', { name: /cancelar/i });
    fireEvent.click(cancelarBtn);

    // Deve aparecer a pergunta de confirmação inline
    expect(await screen.findByText(/deseja realmente cancelar/i)).toBeInTheDocument();
    expect(confirmSpy).not.toHaveBeenCalled();
    confirmSpy.mockRestore();
  });

  it('cancela agendamento ao confirmar inline', async () => {
    cancelarAgendamentoAdmin.mockResolvedValue({});
    listarAgendamentosAdmin.mockResolvedValue({
      agendamentos: [],
      paginacao: { pagina: 1, totalPaginas: 1 },
    });

    render(<AppointmentManager />);
    const cancelarBtn = await screen.findByRole('button', { name: /cancelar/i });
    fireEvent.click(cancelarBtn);

    const simBtn = await screen.findByRole('button', { name: /sim, cancelar/i });
    fireEvent.click(simBtn);

    await waitFor(() => {
      expect(cancelarAgendamentoAdmin).toHaveBeenCalledWith(1);
    });
  });
});

describe('AppointmentManager — fallback de dados vazios', () => {
  it('não crasha quando agendamentos é undefined na resposta', async () => {
    listarAgendamentosAdmin.mockResolvedValue({ paginacao: {} }); // sem agendamentos
    render(<AppointmentManager />);
    expect(await screen.findByText(/nenhum agendamento/i)).toBeInTheDocument();
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ScheduleManager from '../../components/ScheduleManager';

vi.mock('../../services/admin', () => ({
  listarHorariosAdmin: vi.fn(),
  criarHorarioAdmin: vi.fn(),
  desativarHorarioAdmin: vi.fn(),
}));

import { listarHorariosAdmin, criarHorarioAdmin, desativarHorarioAdmin } from '../../services/admin';

const HORARIO_MOCK = {
  id: 1,
  dataInicio: '2026-06-01T00:00:00.000Z',
  dataFim: '2026-06-01T23:59:59.000Z',
  horaInicio: null,
  horaFim: null,
  motivo: 'Feriado',
  ativo: true,
};

beforeEach(() => {
  vi.clearAllMocks();
  listarHorariosAdmin.mockResolvedValue({ horarios: [HORARIO_MOCK] });
  criarHorarioAdmin.mockResolvedValue({ horario: HORARIO_MOCK });
  desativarHorarioAdmin.mockResolvedValue({});
});

describe('ScheduleManager — renderização', () => {
  it('exibe bloqueios carregados', async () => {
    render(<ScheduleManager />);
    expect(await screen.findByText('Feriado')).toBeInTheDocument();
  });

  it('não crasha quando horarios é undefined na resposta', async () => {
    listarHorariosAdmin.mockResolvedValue({});
    render(<ScheduleManager />);
    expect(await screen.findByText(/nenhum bloqueio/i)).toBeInTheDocument();
  });
});

describe('ScheduleManager — criação de bloqueio com timezone correto', () => {
  it('envia datas em UTC via buildISODate (sem shift de timezone)', async () => {
    render(<ScheduleManager />);
    await screen.findByText('Feriado');

    fireEvent.click(screen.getByRole('button', { name: /bloquear horário/i }));

    const dateInputs = screen.getAllByDisplayValue('');
    const [dInicio, dFim] = dateInputs;

    fireEvent.change(dInicio, { target: { value: '2026-06-15' } });
    fireEvent.change(dFim, { target: { value: '2026-06-15' } });

    fireEvent.click(screen.getByRole('button', { name: /confirmar bloqueio/i }));

    await waitFor(() => {
      expect(criarHorarioAdmin).toHaveBeenCalledOnce();
      const [payload] = criarHorarioAdmin.mock.calls[0];
      expect(payload.dataInicio).toBe('2026-06-15T00:00:00.000Z');
      expect(payload.dataFim).toBe('2026-06-15T23:59:59.000Z');
      expect(payload.dataInicio).not.toMatch(/2026-06-14/);
      expect(payload.dataFim).not.toMatch(/2026-06-14/);
    });
  });
});

describe('ScheduleManager — remoção sem confirm()', () => {
  it('mostra confirmação inline ao clicar em remover', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockImplementation(() => true);
    render(<ScheduleManager />);
    await screen.findByText('Feriado');

    const removeBtn = screen.getByRole('button', { name: /remover bloqueio/i });
    fireEvent.click(removeBtn);

    expect(await screen.findByText(/deseja remover este bloqueio/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sim, remover/i })).toBeInTheDocument();
    expect(confirmSpy).not.toHaveBeenCalled();
    confirmSpy.mockRestore();
  });

  it('chama desativarHorarioAdmin ao confirmar remoção inline', async () => {
    render(<ScheduleManager />);
    await screen.findByText('Feriado');

    fireEvent.click(screen.getByRole('button', { name: /remover bloqueio/i }));
    const simBtn = await screen.findByRole('button', { name: /sim, remover/i });
    fireEvent.click(simBtn);

    await waitFor(() => {
      expect(desativarHorarioAdmin).toHaveBeenCalledWith(1);
    });
  });
});

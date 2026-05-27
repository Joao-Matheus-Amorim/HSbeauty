import { describe, beforeEach, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../services/auth', () => ({
  loginAdmin: vi.fn(),
  getAccessToken: vi.fn(),
  getAdminFromSession: vi.fn(),
  logoutAdmin: vi.fn(),
  clearAdminSession: vi.fn(),
}));

vi.mock('../../services/admin', () => ({
  listarAgendamentosAdmin: vi.fn(),
  atualizarAgendamentoAdmin: vi.fn(),
  cancelarAgendamentoAdmin: vi.fn(),
  exportarAgendamentosCSV: vi.fn(),
}));

import { getAccessToken, getAdminFromSession, loginAdmin } from '../../services/auth';
import { listarAgendamentosAdmin } from '../../services/admin';

// Import Admin directly — AppRoutes uses React.lazy which can race in parallel test workers.
// This smoke test covers the Admin page behaviour, not routing.
import Admin from '../../pages/Admin.jsx';

describe('Smoke admin', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    getAccessToken.mockReturnValue(null);
    getAdminFromSession.mockReturnValue(null);
    loginAdmin.mockResolvedValue({
      admin: { id: 1, nome: 'Admin', email: 'admin@hsbeauty.com' },
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });

    listarAgendamentosAdmin.mockResolvedValue({
      agendamentos: [
        {
          id: 1,
          nomeCliente: 'Ana Lima',
          telefone: '21988887777',
          data: '2026-05-27T09:00:00.000Z',
          hora: '09:00',
          status: 'pendente',
          servico: { id: 1, nome: 'Unhas', preco: 60 },
        },
      ],
      paginacao: { pagina: 1, totalPaginas: 1, total: 1 },
    });
  });

  it('executa login admin e abre o painel com dados carregados', async () => {
    render(
      <MemoryRouter>
        <Admin />
      </MemoryRouter>
    );

    expect(await screen.findByRole('heading', { name: /entrar no painel/i })).toBeInTheDocument();

    fireEvent.change(await screen.findByLabelText('Email'), { target: { value: 'admin@hsbeauty.com' } });
    fireEvent.change(await screen.findByLabelText('Senha'), { target: { value: '123456' } });
    fireEvent.click(await screen.findByRole('button', { name: /entrar/i }));

    expect(await screen.findByText(/confirmar/)).toBeInTheDocument();
    expect(await screen.findByText('Ana Lima')).toBeInTheDocument();

    await waitFor(() => {
      expect(loginAdmin).toHaveBeenCalledWith('admin@hsbeauty.com', '123456');
      expect(listarAgendamentosAdmin).toHaveBeenCalled();
    });
  });
});

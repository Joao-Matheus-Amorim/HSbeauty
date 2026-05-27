import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ServiceManager from '../../components/ServiceManager';

vi.mock('../../services/admin', () => ({
  listarServicosAdmin: vi.fn(),
  criarServicoAdmin: vi.fn(),
  atualizarServicoAdmin: vi.fn(),
}));

import { listarServicosAdmin, criarServicoAdmin, atualizarServicoAdmin } from '../../services/admin';

const SERVICO_MOCK = { id: 1, nome: 'Unhas', preco: 35, duracao: 60, ativo: true, descricao: '', categoria: '' };

beforeEach(() => {
  vi.clearAllMocks();
  listarServicosAdmin.mockResolvedValue({ servicos: [SERVICO_MOCK] });
});

describe('ServiceManager — renderização', () => {
  it('exibe serviços carregados da API', async () => {
    render(<ServiceManager />);
    expect(await screen.findByText('Unhas')).toBeInTheDocument();
  });

  it('exibe preço e duração do serviço', async () => {
    render(<ServiceManager />);
    expect(await screen.findByText(/R\$ 35/)).toBeInTheDocument();
    expect(await screen.findByText(/60 min/)).toBeInTheDocument();
  });
});

describe('ServiceManager — fallback de dados', () => {
  it('não crasha quando servicos é undefined na resposta', async () => {
    listarServicosAdmin.mockResolvedValue({});
    render(<ServiceManager />);
    expect(await screen.findByText(/nenhum serviço/i)).toBeInTheDocument();
  });

  it('mostra mensagem de erro da API inline sem alert', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    listarServicosAdmin.mockRejectedValue(new Error('Servidor indisponível'));

    render(<ServiceManager />);
    expect(await screen.findByText(/servidor indisponível/i)).toBeInTheDocument();
    expect(alertSpy).not.toHaveBeenCalled();
    alertSpy.mockRestore();
  });
});

describe('ServiceManager — criação de serviço', () => {
  it('exibe o modal de novo serviço ao clicar no botão', async () => {
    render(<ServiceManager />);
    await screen.findByText('Unhas');
    fireEvent.click(screen.getByRole('button', { name: /novo serviço/i }));
    expect(screen.getByRole('heading', { name: /novo serviço/i })).toBeInTheDocument();
  });

  it('exibe erro de submit inline dentro do modal sem alert', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    criarServicoAdmin.mockRejectedValue(new Error('Nome já existe'));

    render(<ServiceManager />);
    await screen.findByText('Unhas');
    fireEvent.click(screen.getByRole('button', { name: /novo serviço/i }));

    fireEvent.change(screen.getByPlaceholderText(/Ex: Unhas em Gel/i), { target: { value: 'Pedicure' } });
    fireEvent.change(screen.getByPlaceholderText('0.00'), { target: { value: '40' } });
    fireEvent.change(screen.getByPlaceholderText('60'), { target: { value: '45' } });

    fireEvent.click(screen.getByRole('button', { name: /criar serviço/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(alertSpy).not.toHaveBeenCalled();
    });
    alertSpy.mockRestore();
  });
});

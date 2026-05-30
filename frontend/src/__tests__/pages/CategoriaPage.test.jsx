import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AppRoutes from '../../AppRoutes';

vi.mock('../../services/agendamentos', () => ({
  listarServicos: vi.fn(),
  listarCombos: vi.fn(),
  listarCategorias: vi.fn(),
  getSiteConfig: vi.fn(),
  buscarDisponibilidade: vi.fn(),
  criarAgendamento: vi.fn(),
}));

import { listarServicos, listarCombos, listarCategorias, getSiteConfig } from '../../services/agendamentos';

const CAT_UNHAS = { id: 1, nome: 'Unhas', imagemUrl: null, ordem: 0 };
const CAT_CILIOS = { id: 2, nome: 'Cílios', imagemUrl: null, ordem: 1 };

describe('CategoriaPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listarCombos.mockResolvedValue([]);
    getSiteConfig.mockResolvedValue({ bannerUrl: null, logoUrl: null });
    listarCategorias.mockResolvedValue([CAT_UNHAS, CAT_CILIOS]);
    listarServicos.mockResolvedValue([
      { id: 1, nome: 'Esmaltação em Gel', categoria: CAT_UNHAS, duracao: 60, preco: 35, descricao: 'Esmaltação completa' },
      { id: 2, nome: 'Alongamento', categoria: CAT_UNHAS, duracao: 120, preco: 80 },
      { id: 9, nome: 'Fio a fio', categoria: CAT_CILIOS, duracao: 90, preco: 140 },
    ]);
  });

  it('renderiza o nome da categoria no hero e lista apenas servicos da categoria', async () => {
    render(
      <MemoryRouter initialEntries={['/c/1']}>
        <AppRoutes />
      </MemoryRouter>
    );

    expect(await screen.findByRole('heading', { level: 1, name: /unhas/i })).toBeInTheDocument();
    expect(await screen.findByText(/2 servi/i)).toBeInTheDocument();

    // ambos servicos de Unhas
    expect(await screen.findByText('Esmaltação em Gel')).toBeInTheDocument();
    expect(await screen.findByText('Alongamento')).toBeInTheDocument();

    // servico de outra categoria NAO aparece
    expect(screen.queryByText('Fio a fio')).not.toBeInTheDocument();
  });

  it('exibe estado vazio editorial quando categoria nao tem servicos', async () => {
    listarServicos.mockResolvedValue([]);
    render(
      <MemoryRouter initialEntries={['/c/1']}>
        <AppRoutes />
      </MemoryRouter>
    );

    // Eyebrow + titulo + CTAs
    expect(await screen.findByText(/em breve/i)).toBeInTheDocument();
    expect(await screen.findByText(/sendo preparada/i)).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: /ver outras categorias/i })).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: /falar no whatsapp/i })).toBeInTheDocument();
  });

  it('exibe mensagem quando id de categoria nao existe', async () => {
    render(
      <MemoryRouter initialEntries={['/c/999']}>
        <AppRoutes />
      </MemoryRouter>
    );

    expect(await screen.findByText(/categoria n.o encontrada/i)).toBeInTheDocument();
  });
});

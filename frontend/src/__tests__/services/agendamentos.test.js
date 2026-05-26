import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { listarServicos, buscarDisponibilidade, criarAgendamento } from '../../services/agendamentos';

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

function makeResponse(body, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
  };
}

beforeEach(() => {
  mockFetch.mockReset();
  // Simula ambiente local para que API_URL seja o localhost
  vi.stubGlobal('window', { location: { hostname: 'localhost' } });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

// ─── listarServicos ───────────────────────────────────────────────────────────
describe('listarServicos', () => {
  it('chama o endpoint correto sem filtro', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse([]));
    await listarServicos();
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/servicos'));
  });

  it('passa ?ativo=true quando solicitado', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse([]));
    await listarServicos({ ativo: true });
    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain('ativo=true');
  });

  it('lança erro quando resposta não é ok', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse({}, 500));
    await expect(listarServicos()).rejects.toThrow('Erro ao carregar serviços');
  });

  it('retorna array de serviços em sucesso', async () => {
    const servicos = [{ id: 1, nome: 'Unhas', preco: 35, duracao: 150 }];
    mockFetch.mockResolvedValueOnce(makeResponse(servicos));
    const result = await listarServicos({ ativo: true });
    expect(result).toEqual(servicos);
  });
});

// ─── buscarDisponibilidade ────────────────────────────────────────────────────
describe('buscarDisponibilidade', () => {
  it('inclui data e servicoId na URL', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse({ slotsDisponiveis: [] }));
    await buscarDisponibilidade('2026-05-27', 2);
    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain('data=2026-05-27');
    expect(url).toContain('servicoId=2');
  });

  it('lança erro quando resposta não é ok', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse({}, 404));
    await expect(buscarDisponibilidade('2026-05-27', 99)).rejects.toThrow('Erro ao buscar disponibilidade');
  });
});

// ─── criarAgendamento ─────────────────────────────────────────────────────────
describe('criarAgendamento', () => {
  const payload = {
    nomeCliente: 'Maria Silva',
    telefone: '21999999999',
    data: '2026-05-27T09:00:00.000Z',
    servicoId: 1,
  };

  it('faz POST com Content-Type JSON', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse({ id: 1, ...payload }));
    await criarAgendamento(payload);
    const [, opts] = mockFetch.mock.calls[0];
    expect(opts.method).toBe('POST');
    expect(opts.headers['Content-Type']).toBe('application/json');
    expect(JSON.parse(opts.body)).toMatchObject(payload);
  });

  it('retorna o agendamento criado', async () => {
    const criado = { id: 42, ...payload, status: 'pendente' };
    mockFetch.mockResolvedValueOnce(makeResponse(criado));
    const result = await criarAgendamento(payload);
    expect(result.id).toBe(42);
    expect(result.status).toBe('pendente');
  });

  it('lança erro com mensagem do servidor', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse({ erro: 'Horário indisponível' }, 409));
    await expect(criarAgendamento(payload)).rejects.toThrow('Horário indisponível');
  });
});

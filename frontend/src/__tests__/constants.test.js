import { describe, it, expect } from 'vitest';
import { STATUS, WHATSAPP, SERVICOS_PADRAO, SEMANAS_DISPONIVEIS, resolveWhatsApp } from '../constants';

describe('STATUS', () => {
  it('CONCLUIDO não tem acento (deve bater com o banco)', () => {
    expect(STATUS.CONCLUIDO).toBe('concluido');
    expect(STATUS.CONCLUIDO).not.toContain('í'); // garante sem acento
  });

  it('todos os valores de status são strings não-vazias', () => {
    Object.values(STATUS).forEach((v) => {
      expect(typeof v).toBe('string');
      expect(v.length).toBeGreaterThan(0);
    });
  });

  it('contém os 4 status esperados', () => {
    expect(STATUS.PENDENTE).toBe('pendente');
    expect(STATUS.CONFIRMADO).toBe('confirmado');
    expect(STATUS.CANCELADO).toBe('cancelado');
    expect(STATUS.CONCLUIDO).toBe('concluido');
  });
});

describe('WHATSAPP', () => {
  it('usa o valor configurado por ambiente quando informado', () => {
    expect(resolveWhatsApp('5511888888888')).toBe('5511888888888');
  });

  it('usa fallback quando o ambiente nao informa valor', () => {
    expect(resolveWhatsApp('')).toBe(WHATSAPP);
    expect(resolveWhatsApp('   ')).toBe(WHATSAPP);
  });

  it('contém apenas dígitos', () => {
    expect(/^\d+$/.test(WHATSAPP)).toBe(true);
  });

  it('começa com 55 (código do Brasil)', () => {
    expect(WHATSAPP.startsWith('55')).toBe(true);
  });
});

describe('SERVICOS_PADRAO', () => {
  it('é um array com pelo menos 1 serviço', () => {
    expect(Array.isArray(SERVICOS_PADRAO)).toBe(true);
    expect(SERVICOS_PADRAO.length).toBeGreaterThan(0);
  });

  it('cada serviço tem os campos obrigatórios', () => {
    SERVICOS_PADRAO.forEach((s) => {
      expect(typeof s.id).toBe('number');
      expect(typeof s.nome).toBe('string');
      expect(typeof s.preco).toBe('number');
      expect(typeof s.duracao).toBe('number');
      expect(s.duracao).toBeGreaterThan(0);
    });
  });
});

describe('SEMANAS_DISPONIVEIS', () => {
  it('é um número positivo', () => {
    expect(typeof SEMANAS_DISPONIVEIS).toBe('number');
    expect(SEMANAS_DISPONIVEIS).toBeGreaterThan(0);
  });
});

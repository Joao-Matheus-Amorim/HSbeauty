import { describe, it, expect } from 'vitest';
import {
  formatTelefone,
  isValidTelefone,
  isValidEmail,
  formatPreco,
  formatPrecoFixo,
  buildWhatsAppLink,
} from '../../utils/booking-format';

describe('formatTelefone', () => {
  it('aplica mascara progressivamente', () => {
    expect(formatTelefone('')).toBe('');
    expect(formatTelefone('1')).toBe('(1');
    expect(formatTelefone('11')).toBe('(11');
    expect(formatTelefone('11987')).toBe('(11) 987');
    expect(formatTelefone('1198765432')).toBe('(11) 9876-5432');
    expect(formatTelefone('11987654321')).toBe('(11) 98765-4321');
  });

  it('ignora caracteres nao numericos', () => {
    expect(formatTelefone('abc11def987')).toBe('(11) 987');
  });

  it('trunca acima de 11 digitos', () => {
    expect(formatTelefone('119876543210000')).toBe('(11) 98765-4321');
  });
});

describe('isValidTelefone', () => {
  it('aceita 10 e 11 digitos', () => {
    expect(isValidTelefone('1198765432')).toBe(true);
    expect(isValidTelefone('11987654321')).toBe(true);
    expect(isValidTelefone('(11) 98765-4321')).toBe(true);
  });

  it('rejeita menos de 10 e mais de 11', () => {
    expect(isValidTelefone('1198765')).toBe(false);
    expect(isValidTelefone('119876543210')).toBe(false);
  });
});

describe('isValidEmail', () => {
  it('aceita formato basico', () => {
    expect(isValidEmail('maria@example.com')).toBe(true);
    expect(isValidEmail('a.b+c@d.e.f')).toBe(true);
  });

  it('vazio passa (email e opcional)', () => {
    expect(isValidEmail('')).toBe(true);
    expect(isValidEmail('   ')).toBe(true);
    expect(isValidEmail(undefined)).toBe(true);
  });

  it('rejeita formatos invalidos', () => {
    expect(isValidEmail('semarroba')).toBe(false);
    expect(isValidEmail('a@b')).toBe(false);
    expect(isValidEmail('a @b.com')).toBe(false);
  });
});

describe('formatPreco / formatPrecoFixo', () => {
  it('formata com R$ e virgula', () => {
    expect(formatPreco(35.5)).toBe('A partir de R$ 35,50');
    expect(formatPrecoFixo(140)).toBe('R$ 140,00');
  });
});

describe('buildWhatsAppLink', () => {
  it('monta link wa.me encoded com nome e data', () => {
    const agendamento = {
      nomeCliente: 'Maria',
      data: '2026-05-25T09:00:00.000Z',
      servico: { nome: 'Unhas' },
    };
    const link = buildWhatsAppLink('5521999999999', agendamento);
    expect(link.startsWith('https://wa.me/5521999999999?text=')).toBe(true);
    expect(decodeURIComponent(link.split('text=')[1])).toContain('Unhas');
    expect(decodeURIComponent(link.split('text=')[1])).toContain('Maria');
  });

  it('aceita nome do item explicito (override do servico)', () => {
    const agendamento = { nomeCliente: 'Ana', data: '2026-05-25T09:00:00.000Z' };
    const link = buildWhatsAppLink('5521999999999', agendamento, 'Combo Premium');
    expect(decodeURIComponent(link.split('text=')[1])).toContain('Combo Premium');
  });
});

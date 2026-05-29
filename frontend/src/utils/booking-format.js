/**
 * Utilitarios puros de formatacao e validacao usados pelo fluxo de
 * agendamento. Mantidos fora do componente para facilitar reuso e teste.
 */

export function formatTelefone(value) {
  const digits = String(value || '').replace(/\D/g, '').slice(0, 11);
  if (!digits) return '';
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function isValidTelefone(value) {
  const digits = String(value || '').replace(/\D/g, '');
  return digits.length === 10 || digits.length === 11;
}

export function isValidEmail(value) {
  const v = String(value || '').trim();
  if (!v) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export function formatDateTime(value) {
  return new Date(value).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

export function formatPreco(valor) {
  return `A partir de R$ ${Number(valor).toFixed(2).replace('.', ',')}`;
}

export function formatPrecoFixo(valor) {
  return `R$ ${Number(valor).toFixed(2).replace('.', ',')}`;
}

export function buildWhatsAppLink(numero, agendamento, nomeItem) {
  const item = nomeItem || agendamento?.servico?.nome || agendamento?.combo?.nome || 'serviço';
  const dataHora = agendamento?.data ? formatDateTime(agendamento.data) : '';
  const nomeCliente = agendamento?.nomeCliente || '';
  const mensagem = `Olá! Acabei de agendar: ${item} em ${dataHora}. Meu nome é ${nomeCliente}.`;
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`;
}

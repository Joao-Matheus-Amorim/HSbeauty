// ─── Contato ──────────────────────────────────────────────────────────────────
export const WHATSAPP = '5521970976928';

// ─── Janela de agendamento ────────────────────────────────────────────────────
// Quantas semanas à frente (além da semana atual) o cliente pode agendar
export const SEMANAS_DISPONIVEIS = 3;

// ─── Serviços padrão (fallback quando a API não responde) ─────────────────────
export const SERVICOS_PADRAO = [
  { id: 1, nome: 'Unhas',        preco: 35,  duracao: 150, ativo: true },
  { id: 2, nome: 'Cílios',       preco: 140, duracao: 150, ativo: true },
  { id: 3, nome: 'Sobrancelhas', preco: 70,  duracao: 150, ativo: true },
  { id: 4, nome: 'Depilação',    preco: 50,  duracao: 150, ativo: true },
];

// ─── Status de agendamento ────────────────────────────────────────────────────
export const STATUS = {
  PENDENTE:   'pendente',
  CONFIRMADO: 'confirmado',
  CONCLUIDO:  'concluido',   // sem acento — padrão do banco
  CANCELADO:  'cancelado',
};

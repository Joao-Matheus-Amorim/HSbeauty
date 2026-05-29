// ─── Contato ──────────────────────────────────────────────────────────────────
const DEFAULT_WHATSAPP = '5521970976928';

export function resolveWhatsApp(envValue = import.meta.env.VITE_WHATSAPP) {
  const configuredValue = String(envValue || '').trim();
  return configuredValue || DEFAULT_WHATSAPP;
}

export const WHATSAPP = resolveWhatsApp();

// ─── Janela de agendamento ────────────────────────────────────────────────────
// Quantas semanas à frente (além da semana atual) o cliente pode agendar
export const SEMANAS_DISPONIVEIS = 3;

// ─── Serviços padrão (fallback quando a API não responde) ─────────────────────
export const CATEGORIAS_PADRAO = [
  { id: 1, nome: 'Unhas',        imagemUrl: null, ordem: 0 },
  { id: 2, nome: 'Cílios',       imagemUrl: null, ordem: 1 },
  { id: 3, nome: 'Sobrancelhas', imagemUrl: null, ordem: 2 },
  { id: 4, nome: 'Depilação',    imagemUrl: null, ordem: 3 },
];

export const SERVICOS_PADRAO = [
  { id: 1, nome: 'Unhas',        categoria: CATEGORIAS_PADRAO[0], preco: 35,  duracao: 150, ativo: true },
  { id: 2, nome: 'Cílios',       categoria: CATEGORIAS_PADRAO[1], preco: 140, duracao: 150, ativo: true },
  { id: 3, nome: 'Sobrancelhas', categoria: CATEGORIAS_PADRAO[2], preco: 70,  duracao: 150, ativo: true },
  { id: 4, nome: 'Depilação',    categoria: CATEGORIAS_PADRAO[3], preco: 50,  duracao: 150, ativo: true },
];

// ─── Status de agendamento ────────────────────────────────────────────────────
export const STATUS = {
  PENDENTE:   'pendente',
  CONFIRMADO: 'confirmado',
  CONCLUIDO:  'concluido',   // sem acento — padrão do banco
  CANCELADO:  'cancelado',
};

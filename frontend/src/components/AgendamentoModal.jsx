import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { listarServicos, buscarDisponibilidade, criarAgendamento } from '../services/agendamentos';
import { WHATSAPP, SERVICOS_PADRAO, SEMANAS_DISPONIVEIS } from '../constants';
import { formatDuracao, formatDateOnly, getAvailableDays } from '../utils/date-utils';
import './AgendamentoModal.css';

function formatDateTime(value) {
  return new Date(value).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

function buildWhatsAppLink(agendamento) {
  const servico = agendamento?.servico?.nome || 'serviço';
  const dataHora = agendamento?.data ? formatDateTime(agendamento.data) : '';
  const nomeCliente = agendamento?.nomeCliente || '';
  const mensagem = `Olá! Acabei de agendar: ${servico} em ${dataHora}. Meu nome é ${nomeCliente}.`;
  return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(mensagem)}`;
}

// Retorna os próximos N dias úteis a partir de hoje, agrupados por semana
function getAvailableDays(semanas = SEMANAS_DISPONIVEIS) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Começa na segunda-feira desta semana
  const day = today.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const start = new Date(today);
  start.setDate(today.getDate() + diffToMonday);

  const totalDias = semanas * 7;
  const days = [];

  for (let i = 0; i < totalDias; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);

    // Não mostra dias passados
    if (date < today) continue;

    const value = formatDateOnly(date);
    days.push({
      value,
      weekday: date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', ''),
      dayMonth: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      weekLabel: `Semana de ${new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}`,
      weekIndex: Math.floor(i / 7),
    });
  }

  const end = new Date(start);
  end.setDate(start.getDate() + totalDias - 1);

  return {
    days,
    min: formatDateOnly(today),
    max: formatDateOnly(end),
  };
}

export default function AgendamentoModal({ servicoInicial, onClose }) {
  const [step, setStep] = useState(1);
  const [servicos, setServicos] = useState(SERVICOS_PADRAO);
  const [servicoId, setServicoId] = useState(servicoInicial?.id || '');
  const [data, setData] = useState('');
  const [slots, setSlots] = useState([]);
  const [slotSelecionado, setSlotSelecionado] = useState(null);
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [agendado, setAgendado] = useState(null);

  const janela = useMemo(() => getAvailableDays(SEMANAS_DISPONIVEIS), []);

  // Semanas agrupadas para exibição
  const semanas = useMemo(() => {
    const grupos = [];
    janela.days.forEach((dia) => {
      if (!grupos[dia.weekIndex]) {
        grupos[dia.weekIndex] = { label: dia.weekLabel, dias: [] };
      }
      grupos[dia.weekIndex].dias.push(dia);
    });
    return grupos.filter(Boolean);
  }, [janela]);

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    listarServicos({ ativo: true })
      .then((lista) => {
        if (!mounted) return;
        if (Array.isArray(lista) && lista.length > 0) {
          setServicos(lista);
        } else {
          setServicos(SERVICOS_PADRAO);
        }
      })
      .catch(() => {
        if (mounted) setServicos(SERVICOS_PADRAO);
      });
    return () => { mounted = false; };
  }, []);

  function selecionarServico(id) {
    setServicoId(id);
    setSlots([]);
    setSlotSelecionado(null);
    setErro('');
  }

  function selecionarData(value) {
    setData(value);
    setSlots([]);
    setSlotSelecionado(null);
    setErro('');
  }

  async function buscarSlots() {
    if (!servicoId || !data) return;

    setLoading(true);
    setErro('');
    setSlots([]);
    setSlotSelecionado(null);
    try {
      const res = await buscarDisponibilidade(data, servicoId);
      setSlots(res.slotsDisponiveis || []);
      setStep(2);
    } catch (e) {
      setErro(e.message || 'Erro ao buscar disponibilidade');
    } finally {
      setLoading(false);
    }
  }

  async function confirmarAgendamento() {
    if (!nome.trim() || !telefone.trim()) {
      setErro('Preencha nome e telefone');
      return;
    }
    setLoading(true);
    setErro('');
    try {
      const resultado = await criarAgendamento({
        nomeCliente: nome.trim(),
        telefone: telefone.trim(),
        data: slotSelecionado.inicio,
        servicoId: Number(servicoId),
      });
      setAgendado(resultado);
      setStep(4);
    } catch (e) {
      setErro(e.message || 'Erro ao criar agendamento');
    } finally {
      setLoading(false);
    }
  }

  const servicoSelecionado = servicos.find((s) => String(s.id) === String(servicoId));
  const duracaoLabel = servicoSelecionado ? formatDuracao(servicoSelecionado.duracao) : '';

  const modal = (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" role="dialog" aria-modal="true" aria-label="Agendar serviço">
        <button className="modal-close" onClick={onClose} aria-label="Fechar">✕</button>

        {step === 1 && (
          <div className="modal-step modal-step--compact">
            <div className="modal-heading">
              <span className="modal-eyebrow">Agendamento</span>
              <h2 className="modal-title">Escolha seu horário</h2>
            </div>

            <div className="modal-label">
              Serviço
              <div className="service-choice-grid">
                {servicos.map((s) => (
                  <button
                    type="button"
                    key={s.id}
                    className={`service-choice-btn${String(servicoId) === String(s.id) ? ' selected' : ''}`}
                    onClick={() => selecionarServico(s.id)}
                  >
                    <span>{s.nome}</span>
                    <strong>R$ {Number(s.preco).toFixed(2).replace('.', ',')}</strong>
                  </button>
                ))}
              </div>
            </div>

            <div className="modal-label">
              Dia
              {semanas.map((semana, idx) => (
                <div key={idx} className="week-group">
                  <span className="week-group-label">{semana.label}</span>
                  <div className="week-days-grid">
                    {semana.dias.map((dia) => (
                      <button
                        type="button"
                        key={dia.value}
                        className={`week-day-btn${data === dia.value ? ' selected' : ''}`}
                        onClick={() => selecionarData(dia.value)}
                      >
                        <span>{dia.weekday}</span>
                        <strong>{dia.dayMonth}</strong>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {erro && <p className="modal-erro">{erro}</p>}

            <button
              className="modal-btn primary"
              onClick={buscarSlots}
              disabled={!servicoId || !data || loading}
            >
              {loading ? 'Buscando...' : 'Ver horários'}
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="modal-step">
            <button className="modal-back" onClick={() => setStep(1)}>← Voltar</button>
            <h2 className="modal-title">Escolha o horário</h2>
            <p className="modal-sub">
              {servicoSelecionado?.nome}
              {duracaoLabel ? ` · ${duracaoLabel}` : ''}
              {data ? ` · ${new Date(`${data}T12:00`).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}` : ''}
            </p>

            {slots.length === 0 ? (
              <p className="modal-vazio">Nenhum horário disponível neste dia. Tente outro dia.</p>
            ) : (
              <div className="slots-grid">
                {slots.map((slot) => (
                  <button
                    key={slot.inicio}
                    className={`slot-btn${slotSelecionado?.inicio === slot.inicio ? ' selected' : ''}`}
                    onClick={() => setSlotSelecionado(slot)}
                  >
                    {slot.horario}
                  </button>
                ))}
              </div>
            )}

            {erro && <p className="modal-erro">{erro}</p>}

            <button
              className="modal-btn primary"
              onClick={() => setStep(3)}
              disabled={!slotSelecionado}
            >
              Continuar
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="modal-step">
            <button className="modal-back" onClick={() => setStep(2)}>← Voltar</button>
            <h2 className="modal-title">Seus dados</h2>
            <p className="modal-sub">
              {servicoSelecionado?.nome}
              {slotSelecionado?.horario ? ` · ${slotSelecionado.horario}` : ''}
              {duracaoLabel ? ` · ${duracaoLabel}` : ''}
              {data ? ` · ${new Date(`${data}T12:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}` : ''}
            </p>

            <label className="modal-label">
              Seu nome
              <input
                className="modal-input"
                type="text"
                placeholder="Maria da Silva"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
              />
            </label>

            <label className="modal-label">
              WhatsApp / Telefone
              <input
                className="modal-input"
                type="tel"
                placeholder="(21) 99999-9999"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
              />
            </label>

            {erro && <p className="modal-erro">{erro}</p>}

            <button
              className="modal-btn primary"
              onClick={confirmarAgendamento}
              disabled={loading}
            >
              {loading ? 'Agendando...' : 'Confirmar agendamento'}
            </button>
          </div>
        )}

        {step === 4 && agendado && (
          <div className="modal-step modal-step--success">
            <div className="success-icon">✨</div>
            <h2 className="modal-title">Agendamento confirmado!</h2>
            <p className="modal-sub">
              Olá, <strong>{agendado.nomeCliente}</strong>! Seu agendamento foi realizado com sucesso.
            </p>
            <div className="confirmacao-box">
              <p><strong>Serviço:</strong> {agendado.servico?.nome}</p>
              {agendado.servico?.duracao && (
                <p><strong>Duração:</strong> {formatDuracao(agendado.servico.duracao)}</p>
              )}
              <p><strong>Data/Hora:</strong> {formatDateTime(agendado.data)}</p>
              <p><strong>Status:</strong> {agendado.status}</p>
            </div>
            <a
              className="modal-btn whatsapp"
              href={buildWhatsAppLink(agendado)}
              target="_blank"
              rel="noreferrer"
            >
              Confirmar pelo WhatsApp
            </a>
            <button className="modal-btn secondary" onClick={onClose}>Fechar</button>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}

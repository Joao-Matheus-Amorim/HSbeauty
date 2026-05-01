import { useEffect, useState } from 'react';
import { listarServicos, buscarDisponibilidade, criarAgendamento } from '../services/agendamentos';
import './AgendamentoModal.css';

const WHATSAPP = import.meta.env.VITE_WHATSAPP || '5521999999999';

export default function AgendamentoModal({ servicoInicial, onClose }) {
  const [step, setStep] = useState(1); // 1: serviço+data, 2: horário, 3: dados, 4: confirmado
  const [servicos, setServicos] = useState([]);
  const [servicoId, setServicoId] = useState(servicoInicial?.id || '');
  const [data, setData] = useState('');
  const [slots, setSlots] = useState([]);
  const [slotSelecionado, setSlotSelecionado] = useState(null);
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [agendado, setAgendado] = useState(null);

  const hoje = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    listarServicos({ ativo: true }).then(setServicos).catch(() => {});
  }, []);

  useEffect(() => {
    if (servicoInicial) setServicoId(servicoInicial.id);
  }, [servicoInicial]);

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
      setErro(e.message);
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
      setErro(e.message);
    } finally {
      setLoading(false);
    }
  }

  const servicoSelecionado = servicos.find((s) => String(s.id) === String(servicoId));

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" role="dialog" aria-modal="true" aria-label="Agendar serviço">
        <button className="modal-close" onClick={onClose} aria-label="Fechar">Fechar</button>

        {/* ─── Passo 1: Serviço + Data ─────────────────────────── */}
        {step === 1 && (
          <div className="modal-step">
            <h2 className="modal-title">Escolha o serviço</h2>

            <label className="modal-label">
              Serviço
              <select
                className="modal-select"
                value={servicoId}
                onChange={(e) => setServicoId(e.target.value)}
              >
                <option value="">Selecione...</option>
                {servicos.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nome} — R$ {Number(s.preco).toFixed(2).replace('.', ',')} ({s.duracao} min)
                  </option>
                ))}
              </select>
            </label>

            <label className="modal-label">
              Data
              <input
                className="modal-input"
                type="date"
                min={hoje}
                value={data}
                onChange={(e) => setData(e.target.value)}
              />
            </label>

            {erro && <p className="modal-erro">{erro}</p>}

            <button
              className="modal-btn primary"
              onClick={buscarSlots}
              disabled={!servicoId || !data || loading}
            >
              {loading ? 'Buscando...' : 'Ver horários disponíveis'}
            </button>
          </div>
        )}

        {/* ─── Passo 2: Horários ───────────────────────────────── */}
        {step === 2 && (
          <div className="modal-step">
            <button className="modal-back" onClick={() => setStep(1)}>← Voltar</button>
            <h2 className="modal-title">Escolha o horário</h2>
            <p className="modal-sub">
              {servicoSelecionado?.nome} · {data ? new Date(`${data}T12:00`).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' }) : ''}
            </p>

            {slots.length === 0 ? (
              <p className="modal-vazio">Nenhum horário disponível nesta data. Tente outro dia.</p>
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

        {/* ─── Passo 3: Dados pessoais ─────────────────────────── */}
        {step === 3 && (
          <div className="modal-step">
            <button className="modal-back" onClick={() => setStep(2)}>← Voltar</button>
            <h2 className="modal-title">Seus dados</h2>
            <p className="modal-sub">
              {servicoSelecionado?.nome} · {slotSelecionado?.horario} · {data ? new Date(`${data}T12:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : ''}
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

        {/* ─── Passo 4: Confirmado ─────────────────────────────── */}
        {step === 4 && agendado && (
          <div className="modal-step modal-step--success">
            <h2 className="modal-title">Agendamento confirmado!</h2>
            <p className="modal-sub">
              Olá, <strong>{agendado.nomeCliente}</strong>! Seu agendamento foi realizado com sucesso.
            </p>
            <div className="confirmacao-box">
              <p><strong>Serviço:</strong> {agendado.servico?.nome}</p>
              <p><strong>Data/Hora:</strong> {new Date(agendado.data).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</p>
              <p><strong>Status:</strong> {agendado.status}</p>
            </div>
            <a
              className="modal-btn whatsapp"
              href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(`Olá! Acabei de agendar: ${agendado.servico?.nome} em ${new Date(agendado.data).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}. Meu nome é ${agendado.nomeCliente}.`)}`}
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
}

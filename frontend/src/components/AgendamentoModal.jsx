import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { listarServicos, listarCombos, buscarDisponibilidade, criarAgendamento } from '../services/agendamentos';
import { WHATSAPP, SERVICOS_PADRAO, SEMANAS_DISPONIVEIS } from '../constants';
import { formatDuracao, getAvailableDays } from '../utils/date-utils';
import './AgendamentoModal.css';

function formatDateTime(value) {
  return new Date(value).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

function buildWhatsAppLink(agendamento, nomeItem) {
  const item = nomeItem || agendamento?.servico?.nome || agendamento?.combo?.nome || 'serviço';
  const dataHora = agendamento?.data ? formatDateTime(agendamento.data) : '';
  const nomeCliente = agendamento?.nomeCliente || '';
  const mensagem = `Olá! Acabei de agendar: ${item} em ${dataHora}. Meu nome é ${nomeCliente}.`;
  return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(mensagem)}`;
}

function formatPreco(valor) {
  return `A partir de R$ ${Number(valor).toFixed(2).replace('.', ',')}`;
}

function formatPrecoFixo(valor) {
  return `R$ ${Number(valor).toFixed(2).replace('.', ',')}`;
}

function formatTelefone(value) {
  const digits = String(value || '').replace(/\D/g, '').slice(0, 11);
  if (!digits) return '';
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function isValidTelefone(value) {
  const digits = String(value || '').replace(/\D/g, '');
  return digits.length === 10 || digits.length === 11;
}

function isValidEmail(value) {
  const v = String(value || '').trim();
  if (!v) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export default function AgendamentoModal({ servicoInicial, onClose }) {
  const [tipo, setTipo] = useState('servico'); // 'servico' | 'combo'
  const [step, setStep] = useState(1);
  const [servicos, setServicos] = useState(SERVICOS_PADRAO);
  const [combos, setCombos] = useState([]);
  const [servicoId, setServicoId] = useState(servicoInicial?.id || '');
  const [comboId, setComboId] = useState('');
  const [data, setData] = useState('');
  const [availability, setAvailability] = useState({});
  const [slotSelecionado, setSlotSelecionado] = useState(null);
  const [showMoreDates, setShowMoreDates] = useState(false);
  const fetchTokenRef = useRef(0);
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [emailCliente, setEmailCliente] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [errosCampo, setErrosCampo] = useState({ nome: '', telefone: '', email: '' });
  const [agendado, setAgendado] = useState(null);
  const [nomeItemAgendado, setNomeItemAgendado] = useState('');

  const janela = useMemo(() => getAvailableDays(SEMANAS_DISPONIVEIS), []);

  const slotsDoDia = useMemo(
    () => (data ? (availability[data]?.slots || []) : []),
    [data, availability]
  );
  const statusDoDia = data ? availability[data]?.status : undefined;

  const slotsPorTurno = useMemo(() => {
    const manha = [];
    const tarde = [];
    slotsDoDia.forEach((slot) => {
      const hora = Number(String(slot.horario || '').slice(0, 2));
      if (hora < 12) manha.push(slot); else tarde.push(slot);
    });
    return { manha, tarde };
  }, [slotsDoDia]);

  const semanas = useMemo(() => {
    const grupos = [];
    janela.days.forEach((dia) => {
      if (!grupos[dia.weekIndex]) grupos[dia.weekIndex] = { label: dia.weekLabel || `Semana ${dia.weekIndex + 1}`, dias: [] };
      grupos[dia.weekIndex].dias.push(dia);
    });
    return grupos.filter(Boolean);
  }, [janela]);

  const semanaAtual = useMemo(() => semanas[0]?.dias || [], [semanas]);
  const semanasFuturas = useMemo(() => semanas.slice(1), [semanas]);
  const idAtivoEffect = tipo === 'servico' ? servicoId : comboId;

  useEffect(() => {
    if (!idAtivoEffect || !semanaAtual.length) return;
    fetchTokenRef.current += 1;
    const token = fetchTokenRef.current;

    Promise.resolve().then(() => {
      if (token !== fetchTokenRef.current) return;
      setAvailability((prev) => {
        const inicial = {};
        semanaAtual.forEach((dia) => {
          inicial[dia.value] = prev[dia.value] || { status: 'loading', slots: [] };
        });
        return inicial;
      });

      semanaAtual.forEach(async (dia) => {
        try {
          const res = tipo === 'servico'
            ? await buscarDisponibilidade(dia.value, idAtivoEffect)
            : await buscarDisponibilidade(dia.value, null, idAtivoEffect);
          if (token !== fetchTokenRef.current) return;
          setAvailability((prev) => ({
            ...prev,
            [dia.value]: { status: 'ready', slots: res.slotsDisponiveis || [] },
          }));
        } catch {
          if (token !== fetchTokenRef.current) return;
          setAvailability((prev) => ({
            ...prev,
            [dia.value]: { status: 'error', slots: [] },
          }));
        }
      });
    });
  }, [idAtivoEffect, tipo, semanaAtual]);

  function fetchDisponibilidadeDia(dia) {
    if (!idAtivoEffect) return;
    const cached = availability[dia.value];
    if (cached && cached.status !== 'error') return;
    const token = fetchTokenRef.current;
    setAvailability((prev) => ({ ...prev, [dia.value]: { status: 'loading', slots: [] } }));
    (async () => {
      try {
        const res = tipo === 'servico'
          ? await buscarDisponibilidade(dia.value, idAtivoEffect)
          : await buscarDisponibilidade(dia.value, null, idAtivoEffect);
        if (token !== fetchTokenRef.current) return;
        setAvailability((prev) => ({
          ...prev,
          [dia.value]: { status: 'ready', slots: res.slotsDisponiveis || [] },
        }));
      } catch {
        if (token !== fetchTokenRef.current) return;
        setAvailability((prev) => ({
          ...prev,
          [dia.value]: { status: 'error', slots: [] },
        }));
      }
    })();
  }

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = originalOverflow; };
  }, []);

  useEffect(() => {
    let mounted = true;
    listarServicos({ ativo: true })
      .then((lista) => {
        if (!mounted) return;
        setServicos(Array.isArray(lista) && lista.length > 0 ? lista : SERVICOS_PADRAO);
      })
      .catch(() => { if (mounted) setServicos(SERVICOS_PADRAO); });
    listarCombos()
      .then((lista) => { if (mounted && Array.isArray(lista)) setCombos(lista); })
      .catch(() => {});
    return () => { mounted = false; };
  }, []);

  function selecionarTipo(novoTipo) {
    setTipo(novoTipo);
    setServicoId('');
    setComboId('');
    setAvailability({});
    setSlotSelecionado(null);
    setErro('');
  }

  function selecionarServico(id) {
    setServicoId(id);
    setAvailability({});
    setSlotSelecionado(null);
    setErro('');
  }

  function selecionarCombo(id) {
    setComboId(id);
    setAvailability({});
    setSlotSelecionado(null);
    setErro('');
  }

  function selecionarData(value) {
    setData(value);
    setSlotSelecionado(null);
    setErro('');
    setShowMoreDates(false);
  }

  function validarCampos() {
    const novos = { nome: '', telefone: '', email: '' };
    if (nome.trim().length < 2) novos.nome = 'Informe seu nome completo';
    if (!isValidTelefone(telefone)) novos.telefone = 'Telefone inválido — use (11) 98765-4321';
    if (!isValidEmail(emailCliente)) novos.email = 'Email inválido';
    setErrosCampo(novos);
    return !novos.nome && !novos.telefone && !novos.email;
  }

  async function confirmarAgendamento() {
    if (!slotSelecionado) { setErro('Selecione um horário'); return; }
    if (!validarCampos()) { setErro(''); return; }

    setLoading(true);
    setErro('');
    try {
      const payload = {
        nomeCliente: nome.trim(),
        telefone: telefone.trim(),
        data: slotSelecionado.inicio,
        ...(tipo === 'servico' ? { servicoId: Number(servicoId) } : { comboId: Number(comboId) }),
        ...(emailCliente.trim() ? { email: emailCliente.trim() } : {}),
      };
      const resultado = await criarAgendamento(payload);
      const nomeItem =
        resultado?.servico?.nome ||
        resultado?.combo?.nome ||
        (tipo === 'servico'
          ? servicos.find((s) => String(s.id) === String(servicoId))?.nome
          : combos.find((c) => String(c.id) === String(comboId))?.nome) ||
        '';
      setNomeItemAgendado(nomeItem);
      setAgendado(resultado);
      setStep(4);
    } catch (e) {
      setErro(e.message || 'Erro ao criar agendamento');
    } finally {
      setLoading(false);
    }
  }

  const servicoSelecionado = servicos.find((s) => String(s.id) === String(servicoId));
  const comboSelecionado = combos.find((c) => String(c.id) === String(comboId));
  const itemSelecionado = tipo === 'servico' ? servicoSelecionado : comboSelecionado;
  const duracaoLabel = itemSelecionado
    ? tipo === 'servico'
      ? formatDuracao(itemSelecionado.duracao)
      : formatDuracao(itemSelecionado.itens?.reduce((s, i) => s + i.servico.duracao, 0) || 0)
    : '';
  const idAtivo = tipo === 'servico' ? servicoId : comboId;

  const modal = (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" role="dialog" aria-modal="true" aria-label="Agendar serviço">
        <button className="modal-close" onClick={onClose} aria-label="Fechar">X</button>

        {step === 1 && (
          <div className="modal-step modal-step--compact">
            <div className="modal-heading">
              <span className="modal-eyebrow">Agendamento</span>
              <h2 className="modal-title">Escolha seu horário</h2>
            </div>

            {/* Tipo: Serviço ou Combo */}
            <div className="modal-tipo-toggle">
              <button
                type="button"
                className={`tipo-btn${tipo === 'servico' ? ' selected' : ''}`}
                onClick={() => selecionarTipo('servico')}
              >
                Serviço
              </button>
              {combos.length > 0 && (
                <button
                  type="button"
                  className={`tipo-btn${tipo === 'combo' ? ' selected' : ''}`}
                  onClick={() => selecionarTipo('combo')}
                >
                  Combo
                </button>
              )}
            </div>

            {tipo === 'servico' && (
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
                      <strong>{formatPreco(s.preco)}</strong>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {tipo === 'combo' && (
              <div className="modal-label">
                Combo
                <div className="service-choice-grid">
                  {combos.map((c) => {
                    const duracaoTotal = c.itens?.reduce((s, i) => s + i.servico.duracao, 0) || 0;
                    return (
                      <button
                        type="button"
                        key={c.id}
                        className={`service-choice-btn combo-choice-btn${String(comboId) === String(c.id) ? ' selected' : ''}`}
                        onClick={() => selecionarCombo(c.id)}
                      >
                        <span>{c.nome}</span>
                        {c.descricao && <em className="combo-desc">{c.descricao}</em>}
                        <ul className="combo-servicos-list">
                          {c.itens?.map((item) => (
                            <li key={item.id}>{item.servico.nome}</li>
                          ))}
                        </ul>
                        <div className="combo-footer">
                          <strong>{formatPrecoFixo(c.preco)}</strong>
                          {duracaoTotal > 0 && <span>{formatDuracao(duracaoTotal)}</span>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {idAtivo && (
              <div className="modal-label">
                Dia desta semana
                <div className="week-days-grid">
                  {semanaAtual.map((dia) => {
                    const status = availability[dia.value]?.status;
                    const slotsCount = availability[dia.value]?.slots?.length ?? null;
                    const semVagas = status === 'ready' && slotsCount === 0;
                    return (
                      <button
                        type="button"
                        key={dia.value}
                        className={`week-day-btn${data === dia.value ? ' selected' : ''}${semVagas ? ' is-cheio' : ''}`}
                        onClick={() => selecionarData(dia.value)}
                        disabled={semVagas}
                        aria-label={`${dia.weekday} ${dia.dayMonth}${semVagas ? ' — sem vagas' : ''}`}
                      >
                        <span>{dia.weekday}</span>
                        <strong>{dia.dayMonth}</strong>
                        {semVagas && <span className="week-day-badge">cheio</span>}
                        {status === 'ready' && slotsCount > 0 && slotsCount <= 2 && (
                          <span className="week-day-badge week-day-badge--last">últimas</span>
                        )}
                      </button>
                    );
                  })}
                </div>
                {semanasFuturas.length > 0 && (
                  <button
                    type="button"
                    className="more-dates-btn"
                    onClick={() => setShowMoreDates(true)}
                  >
                    + Mais datas
                  </button>
                )}
              </div>
            )}

            {data && (
              <div className="modal-label">
                Horários — {new Date(`${data}T12:00`).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
                {statusDoDia === 'loading' ? (
                  <div className="slots-grid" aria-busy="true" aria-label="Carregando horários">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <span key={i} className="slot-skeleton" aria-hidden="true" />
                    ))}
                  </div>
                ) : statusDoDia === 'error' ? (
                  <div className="modal-vazio-box">
                    <p className="modal-vazio">Erro ao buscar horários.</p>
                    <button
                      type="button"
                      className="modal-btn secondary"
                      onClick={() => fetchDisponibilidadeDia({ value: data })}
                    >
                      Tentar novamente
                    </button>
                  </div>
                ) : slotsDoDia.length === 0 ? (
                  <p className="modal-vazio">Não há horários disponíveis neste dia. Escolha outro.</p>
                ) : (
                  <div className="slots-turnos">
                    {slotsPorTurno.manha.length > 0 && (
                      <div className="slots-turno">
                        <span className="slots-turno-label">Manhã</span>
                        <div className="slots-grid">
                          {slotsPorTurno.manha.map((slot) => (
                            <button
                              type="button"
                              key={slot.inicio}
                              className={`slot-btn${slotSelecionado?.inicio === slot.inicio ? ' selected' : ''}`}
                              onClick={() => setSlotSelecionado(slot)}
                            >
                              {slot.horario}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {slotsPorTurno.tarde.length > 0 && (
                      <div className="slots-turno">
                        <span className="slots-turno-label">Tarde</span>
                        <div className="slots-grid">
                          {slotsPorTurno.tarde.map((slot) => (
                            <button
                              type="button"
                              key={slot.inicio}
                              className={`slot-btn${slotSelecionado?.inicio === slot.inicio ? ' selected' : ''}`}
                              onClick={() => setSlotSelecionado(slot)}
                            >
                              {slot.horario}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
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

        {showMoreDates && (
          <div className="more-dates-sheet" role="dialog" aria-modal="true" aria-label="Mais datas">
            <div className="more-dates-sheet-inner">
              <header className="more-dates-header">
                <h3>Mais datas</h3>
                <button type="button" className="more-dates-close" onClick={() => setShowMoreDates(false)} aria-label="Fechar">X</button>
              </header>
              {semanasFuturas.map((semana, idx) => (
                <div key={idx} className="week-group">
                  <span className="week-group-label">{semana.label}</span>
                  <div className="week-days-grid">
                    {semana.dias.map((dia) => (
                      <button
                        type="button"
                        key={dia.value}
                        className={`week-day-btn${data === dia.value ? ' selected' : ''}`}
                        onClick={() => {
                          selecionarData(dia.value);
                          fetchDisponibilidadeDia(dia);
                        }}
                      >
                        <span>{dia.weekday}</span>
                        <strong>{dia.dayMonth}</strong>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="modal-step">
            <button className="modal-back" onClick={() => setStep(1)}>← Voltar</button>
            <h2 className="modal-title">Seus dados</h2>
            <p className="modal-sub">
              {itemSelecionado?.nome}
              {slotSelecionado?.horario ? ` · ${slotSelecionado.horario}` : ''}
              {duracaoLabel ? ` · ${duracaoLabel}` : ''}
              {data ? ` · ${new Date(`${data}T12:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}` : ''}
            </p>

            <label className="modal-label">
              Seu nome
              <input
                className={`modal-input${errosCampo.nome ? ' modal-input--erro' : ''}`}
                type="text"
                placeholder="Maria da Silva"
                value={nome}
                onChange={(e) => { setNome(e.target.value); if (errosCampo.nome) setErrosCampo({ ...errosCampo, nome: '' }); }}
                onBlur={() => setErrosCampo({ ...errosCampo, nome: nome.trim().length < 2 ? 'Informe seu nome completo' : '' })}
                autoComplete="name"
              />
              {errosCampo.nome && <span className="modal-erro-campo">{errosCampo.nome}</span>}
            </label>

            <label className="modal-label">
              WhatsApp / Telefone
              <input
                className={`modal-input${errosCampo.telefone ? ' modal-input--erro' : ''}`}
                type="tel"
                inputMode="numeric"
                placeholder="(21) 99999-9999"
                maxLength={15}
                value={telefone}
                onChange={(e) => { setTelefone(formatTelefone(e.target.value)); if (errosCampo.telefone) setErrosCampo({ ...errosCampo, telefone: '' }); }}
                onBlur={() => setErrosCampo({ ...errosCampo, telefone: telefone && !isValidTelefone(telefone) ? 'Telefone inválido — use (11) 98765-4321' : '' })}
                autoComplete="tel"
              />
              {errosCampo.telefone && <span className="modal-erro-campo">{errosCampo.telefone}</span>}
            </label>

            <label className="modal-label">
              Email <span style={{ fontWeight: 400, fontSize: '0.85em', color: '#888' }}>(opcional — receba confirmação por email)</span>
              <input
                className={`modal-input${errosCampo.email ? ' modal-input--erro' : ''}`}
                type="email"
                placeholder="seu@email.com"
                value={emailCliente}
                onChange={(e) => { setEmailCliente(e.target.value); if (errosCampo.email) setErrosCampo({ ...errosCampo, email: '' }); }}
                onBlur={() => setErrosCampo({ ...errosCampo, email: !isValidEmail(emailCliente) ? 'Email inválido' : '' })}
                autoComplete="email"
              />
              {errosCampo.email && <span className="modal-erro-campo">{errosCampo.email}</span>}
            </label>

            {erro && <p className="modal-erro">{erro}</p>}

            <button className="modal-btn primary" onClick={confirmarAgendamento} disabled={loading}>
              {loading ? 'Agendando...' : 'Confirmar agendamento'}
            </button>
          </div>
        )}

        {step === 4 && agendado && (
          <div className="modal-step modal-step--success">
            <div className="success-icon">OK</div>
            <h2 className="modal-title">Agendamento confirmado!</h2>
            <p className="modal-sub">
              Olá, <strong>{agendado.nomeCliente}</strong>! Seu agendamento foi realizado com sucesso.
            </p>
            <div className="confirmacao-box">
              <p><strong>{agendado.combo ? 'Combo' : 'Serviço'}:</strong> {nomeItemAgendado}</p>
              {agendado.combo && agendado.combo.itens && (
                <ul style={{ margin: '4px 0 8px 16px', fontSize: '0.9em', color: '#555' }}>
                  {agendado.combo.itens.map((item) => (
                    <li key={item.id}>{item.servico.nome}</li>
                  ))}
                </ul>
              )}
              {agendado.servico?.duracao && <p><strong>Duração:</strong> {formatDuracao(agendado.servico.duracao)}</p>}
              <p><strong>Data/Hora:</strong> {formatDateTime(agendado.data)}</p>
              <p><strong>Status:</strong> {agendado.status}</p>
            </div>
            <a className="modal-btn whatsapp" href={buildWhatsAppLink(agendado, nomeItemAgendado)} target="_blank" rel="noreferrer">
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

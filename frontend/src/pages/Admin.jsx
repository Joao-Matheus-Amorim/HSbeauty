import { useEffect, useState, useMemo } from 'react';
import AdminLogin from './AdminLogin';
import {
  listarAgendamentos,
  atualizarAgendamento,
  excluirAgendamento,
  listarBloqueios,
  criarBloqueio,
  removerBloqueio,
  listarServicosAdmin,
  criarServico,
  atualizarServico,
  desativarServico,
} from '../services/agendamentos';
import './Admin.css';

const STATUS_OPTIONS = ['pendente', 'confirmado', 'cancelado', 'concluido'];
const STATUS_COLOR = { pendente: '#f59e0b', confirmado: '#10b981', cancelado: '#ef4444', concluido: '#6366f1' };
const STATUS_LABEL = { pendente: '⏳ Pendente', confirmado: '✅ Confirmado', cancelado: '❌ Cancelado', concluido: '💜 Concluído' };

function getAdminFromSession() {
  try { return JSON.parse(sessionStorage.getItem('hs_admin')); } catch { return null; }
}

export default function Admin() {
  const [admin, setAdmin] = useState(() => {
    const token = sessionStorage.getItem('hs_token');
    return token ? getAdminFromSession() : null;
  });
  if (!admin) return <AdminLogin onLogin={setAdmin} />;
  return <AdminDashboard admin={admin} onLogout={() => {
    sessionStorage.removeItem('hs_token');
    sessionStorage.removeItem('hs_admin');
    setAdmin(null);
  }} />;
}

function AdminDashboard({ admin, onLogout }) {
  const [tab, setTab] = useState('dashboard');
  const tabs = [
    { id: 'dashboard', icon: '📊', label: 'Dashboard' },
    { id: 'agendamentos', icon: '📅', label: 'Agendamentos' },
    { id: 'horarios', icon: '🕐', label: 'Horários' },
    { id: 'servicos', icon: '✂️', label: 'Serviços' },
  ];
  return (
    <div className="crm-wrap">
      <aside className="crm-sidebar">
        <div className="crm-logo">
          <svg width="36" height="36" viewBox="0 0 40 40" fill="none" aria-label="HSBeauty">
            <circle cx="20" cy="20" r="20" fill="#b5936a"/>
            <text x="50%" y="56%" dominantBaseline="middle" textAnchor="middle" fill="#fff" fontSize="14" fontWeight="bold" fontFamily="serif">HS</text>
          </svg>
          <span>HSBeauty</span>
        </div>
        <nav className="crm-nav">
          {tabs.map(t => (
            <button key={t.id} className={`crm-nav-item${tab === t.id ? ' active' : ''}`} onClick={() => setTab(t.id)}>
              <span className="crm-nav-icon">{t.icon}</span>
              <span className="crm-nav-label">{t.label}</span>
            </button>
          ))}
        </nav>
        <div className="crm-sidebar-footer">
          <div className="crm-user">
            <div className="crm-avatar">{admin?.email?.[0]?.toUpperCase()}</div>
            <span className="crm-user-email">{admin?.email}</span>
          </div>
          <button className="crm-logout" onClick={onLogout} title="Sair">⏻</button>
        </div>
      </aside>
      <main className="crm-main">
        <div className="crm-topbar">
          <h1 className="crm-page-title">
            {tabs.find(t => t.id === tab)?.icon} {tabs.find(t => t.id === tab)?.label}
          </h1>
          <span className="crm-date">{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}</span>
        </div>
        <div className="crm-content">
          {tab === 'dashboard' && <TabDashboard onNavigate={setTab} />}
          {tab === 'agendamentos' && <TabAgendamentos />}
          {tab === 'horarios' && <TabHorarios />}
          {tab === 'servicos' && <TabServicos />}
        </div>
      </main>
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────

function TabDashboard({ onNavigate }) {
  const [agendamentos, setAgendamentos] = useState([]);
  const [servicos, setServicos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([listarAgendamentos(), listarServicosAdmin()])
      .then(([ag, sv]) => { setAgendamentos(ag); setServicos(sv); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const hoje = new Date().toISOString().slice(0, 10);
  const inicioSemana = (() => { const d = new Date(); d.setDate(d.getDate() - d.getDay()); return d.toISOString().slice(0, 10); })();
  const inicioMes = new Date().toISOString().slice(0, 8) + '01';

  const agHoje = agendamentos.filter(a => a.data?.slice(0, 10) === hoje);
  const agSemana = agendamentos.filter(a => a.data?.slice(0, 10) >= inicioSemana);
  const agMes = agendamentos.filter(a => a.data?.slice(0, 10) >= inicioMes);
  const agPendentes = agendamentos.filter(a => a.status === 'pendente');
  const agConfirmados = agendamentos.filter(a => a.status === 'confirmado');
  const agCancelados = agendamentos.filter(a => a.status === 'cancelado');
  const agConcluidos = agendamentos.filter(a => a.status === 'concluido');

  const receitaMes = agMes
    .filter(a => a.status !== 'cancelado')
    .reduce((sum, a) => sum + (Number(a.servico?.preco) || 0), 0);

  const receitaTotal = agendamentos
    .filter(a => a.status === 'concluido')
    .reduce((sum, a) => sum + (Number(a.servico?.preco) || 0), 0);

  // Agendamentos por dia — últimos 14 dias
  const ultimos14 = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    return d.toISOString().slice(0, 10);
  });
  const porDia = ultimos14.map(dia => ({
    dia,
    label: new Date(`${dia}T12:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    total: agendamentos.filter(a => a.data?.slice(0, 10) === dia).length,
    confirmados: agendamentos.filter(a => a.data?.slice(0, 10) === dia && a.status === 'confirmado').length,
  }));
  const maxDia = Math.max(...porDia.map(d => d.total), 1);

  // Serviços mais agendados
  const porServico = servicos.map(s => ({
    nome: s.nome,
    total: agendamentos.filter(a => a.servicoId === s.id || a.servico?.id === s.id).length,
    receita: agendamentos
      .filter(a => (a.servicoId === s.id || a.servico?.id === s.id) && a.status !== 'cancelado')
      .reduce((sum) => sum + Number(s.preco), 0),
  })).sort((a, b) => b.total - a.total);
  const maxServico = Math.max(...porServico.map(s => s.total), 1);

  // Próximos agendamentos
  const proximos = agendamentos
    .filter(a => a.data?.slice(0, 10) >= hoje && a.status !== 'cancelado')
    .sort((a, b) => new Date(a.data) - new Date(b.data))
    .slice(0, 5);

  if (loading) return <div className="crm-loading"><div className="crm-spinner" />Carregando dados...</div>;

  return (
    <div className="dash-grid">
      {/* KPIs */}
      <div className="kpi-row">
        <KPI icon="📅" label="Hoje" value={agHoje.length} sub={`${agHoje.filter(a=>a.status==='confirmado').length} confirmados`} color="#b5936a" />
        <KPI icon="📆" label="Esta semana" value={agSemana.length} sub={`${agSemana.filter(a=>a.status!=='cancelado').length} ativos`} color="#6366f1" />
        <KPI icon="🗓️" label="Este mês" value={agMes.length} sub={`${agMes.filter(a=>a.status==='cancelado').length} cancelados`} color="#10b981" />
        <KPI icon="💰" label="Receita do mês" value={`R$ ${receitaMes.toFixed(2).replace('.',',')} `} sub="excl. cancelados" color="#f59e0b" />
        <KPI icon="✅" label="Total concluído" value={`R$ ${receitaTotal.toFixed(2).replace('.',',')} `} sub={`${agConcluidos.length} atendimentos`} color="#10b981" />
        <KPI icon="⏳" label="Pendentes" value={agPendentes.length} sub="aguardando confirmação" color="#f59e0b" onClick={() => onNavigate('agendamentos')} />
      </div>

      {/* Status doughnut visual */}
      <div className="dash-card dash-status-card">
        <h3 className="dash-card-title">Status dos Agendamentos</h3>
        <div className="status-bars">
          {[
            { label: 'Pendentes', count: agPendentes.length, color: STATUS_COLOR.pendente },
            { label: 'Confirmados', count: agConfirmados.length, color: STATUS_COLOR.confirmado },
            { label: 'Concluídos', count: agConcluidos.length, color: STATUS_COLOR.concluido },
            { label: 'Cancelados', count: agCancelados.length, color: STATUS_COLOR.cancelado },
          ].map(s => (
            <div key={s.label} className="status-bar-row">
              <span className="status-bar-label">{s.label}</span>
              <div className="status-bar-track">
                <div className="status-bar-fill" style={{ width: `${agendamentos.length ? (s.count / agendamentos.length) * 100 : 0}%`, background: s.color }} />
              </div>
              <span className="status-bar-count" style={{ color: s.color }}>{s.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Gráfico de barras — agendamentos por dia */}
      <div className="dash-card dash-chart-card">
        <h3 className="dash-card-title">Agendamentos — Últimos 14 dias</h3>
        <div className="bar-chart">
          {porDia.map(d => (
            <div key={d.dia} className={`bar-col${d.dia === hoje ? ' bar-col--today' : ''}`}>
              <div className="bar-value">{d.total > 0 ? d.total : ''}</div>
              <div className="bar-wrap">
                <div className="bar-fill" style={{ height: `${(d.total / maxDia) * 100}%`, background: d.dia === hoje ? '#b5936a' : '#d4b896' }} />
              </div>
              <div className="bar-label">{d.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Ranking de serviços */}
      <div className="dash-card">
        <h3 className="dash-card-title">🏆 Serviços mais agendados</h3>
        <div className="ranking-list">
          {porServico.length === 0 ? <p className="crm-empty-sm">Sem dados ainda</p> : porServico.map((s, i) => (
            <div key={s.nome} className="ranking-item">
              <span className="ranking-pos">{i + 1}°</span>
              <div className="ranking-info">
                <span className="ranking-nome">{s.nome}</span>
                <div className="ranking-bar-track">
                  <div className="ranking-bar-fill" style={{ width: `${(s.total / maxServico) * 100}%` }} />
                </div>
              </div>
              <div className="ranking-stats">
                <span className="ranking-total">{s.total} ag.</span>
                <span className="ranking-receita">R$ {s.receita.toFixed(2).replace('.',',')}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Próximos agendamentos */}
      <div className="dash-card dash-proximos-card">
        <div className="dash-card-header">
          <h3 className="dash-card-title">🗓 Próximos agendamentos</h3>
          <button className="crm-link-btn" onClick={() => onNavigate('agendamentos')}>Ver todos →</button>
        </div>
        {proximos.length === 0 ? (
          <p className="crm-empty-sm">Nenhum agendamento futuro.</p>
        ) : (
          <div className="proximos-list">
            {proximos.map(a => (
              <div key={a.id} className="proximo-item">
                <div className="proximo-time">
                  <span className="proximo-hora">{new Date(a.data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                  <span className="proximo-data">{new Date(a.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</span>
                </div>
                <div className="proximo-info">
                  <span className="proximo-nome">{a.nomeCliente}</span>
                  <span className="proximo-servico">{a.servico?.nome}</span>
                </div>
                <span className="admin-status-badge" style={{ background: STATUS_COLOR[a.status] || '#888' }}>
                  {a.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function KPI({ icon, label, value, sub, color, onClick }) {
  return (
    <div className={`kpi-card${onClick ? ' kpi-card--clickable' : ''}`} onClick={onClick} style={{ borderTopColor: color }}>
      <div className="kpi-icon" style={{ color }}>{icon}</div>
      <div className="kpi-body">
        <span className="kpi-value">{value}</span>
        <span className="kpi-label">{label}</span>
        <span className="kpi-sub">{sub}</span>
      </div>
    </div>
  );
}

// ─── AGENDAMENTOS ─────────────────────────────────────────────────────────────

function TabAgendamentos() {
  const [agendamentos, setAgendamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [filtro, setFiltro] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');
  const [filtroData, setFiltroData] = useState('');
  const [editando, setEditando] = useState(null);
  const [editStatus, setEditStatus] = useState('');
  const [saving, setSaving] = useState(false);

  async function carregar() {
    setLoading(true); setErro('');
    try { setAgendamentos(await listarAgendamentos()); }
    catch (e) { setErro(e.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { carregar(); }, []);

  async function salvarStatus(id) {
    setSaving(true);
    try { await atualizarAgendamento(id, { status: editStatus }); setEditando(null); carregar(); }
    catch (e) { setErro(e.message); }
    finally { setSaving(false); }
  }

  async function cancelar(id) {
    if (!confirm('Cancelar este agendamento?')) return;
    try { await atualizarAgendamento(id, { status: 'cancelado' }); carregar(); }
    catch (e) { setErro(e.message); }
  }

  async function excluir(id) {
    if (!confirm('Excluir permanentemente?')) return;
    try { await excluirAgendamento(id); carregar(); }
    catch (e) { setErro(e.message); }
  }

  const filtrados = useMemo(() => agendamentos.filter(a => {
    if (filtroStatus && a.status !== filtroStatus) return false;
    if (filtroData && a.data?.slice(0, 10) !== filtroData) return false;
    if (!filtro) return true;
    const f = filtro.toLowerCase();
    return a.nomeCliente?.toLowerCase().includes(f) || a.telefone?.includes(f) || a.servico?.nome?.toLowerCase().includes(f);
  }), [agendamentos, filtro, filtroStatus, filtroData]);

  return (
    <div className="crm-section">
      <div className="crm-section-toolbar">
        <input className="crm-search" type="search" placeholder="🔍 Buscar cliente, telefone, serviço..." value={filtro} onChange={e => setFiltro(e.target.value)} />
        <select className="crm-filter-select" value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}>
          <option value="">Todos os status</option>
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <input className="crm-filter-date" type="date" value={filtroData} onChange={e => setFiltroData(e.target.value)} />
        <button className="crm-btn outline" onClick={() => { setFiltro(''); setFiltroStatus(''); setFiltroData(''); }}>Limpar</button>
        <button className="crm-btn ghost" onClick={carregar}>↺</button>
      </div>

      <div className="crm-count-row">
        <span>{filtrados.length} agendamento{filtrados.length !== 1 ? 's' : ''}</span>
        {filtroStatus && <span className="crm-tag" style={{ background: STATUS_COLOR[filtroStatus] }}>{filtroStatus}</span>}
      </div>

      {erro && <div className="crm-alert crm-alert--error">{erro}</div>}

      {loading ? <div className="crm-loading"><div className="crm-spinner" />Carregando...</div> : filtrados.length === 0 ? (
        <div className="crm-empty">📭 Nenhum agendamento encontrado</div>
      ) : (
        <div className="crm-table-wrap">
          <table className="crm-table">
            <thead>
              <tr>
                <th>#</th><th>Cliente</th><th>Telefone</th><th>Serviço</th><th>Preço</th><th>Data / Hora</th><th>Status</th><th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map(a => (
                <tr key={a.id}>
                  <td className="td-id">{a.id}</td>
                  <td className="td-name"><strong>{a.nomeCliente}</strong></td>
                  <td>
                    <a href={`https://wa.me/55${a.telefone?.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" className="wpp-link">📱 {a.telefone}</a>
                  </td>
                  <td>{a.servico?.nome || '—'}</td>
                  <td className="td-price">R$ {Number(a.servico?.preco || 0).toFixed(2).replace('.',',')}</td>
                  <td className="td-date">{a.data ? new Date(a.data).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '—'}</td>
                  <td>
                    {editando === a.id ? (
                      <div className="status-edit">
                        <select value={editStatus} onChange={e => setEditStatus(e.target.value)} className="crm-select-sm">
                          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <button className="crm-btn primary tiny" onClick={() => salvarStatus(a.id)} disabled={saving}>✓</button>
                        <button className="crm-btn ghost tiny" onClick={() => setEditando(null)}>✕</button>
                      </div>
                    ) : (
                      <span className="status-badge" style={{ background: STATUS_COLOR[a.status] || '#888' }} onClick={() => { setEditando(a.id); setEditStatus(a.status); }} title="Clique para editar">
                        {a.status}
                      </span>
                    )}
                  </td>
                  <td className="td-actions">
                    {a.status !== 'cancelado' && <button className="crm-btn danger tiny" onClick={() => cancelar(a.id)}>Cancelar</button>}
                    <button className="crm-btn danger-outline tiny" onClick={() => excluir(a.id)}>Excluir</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── HORÁRIOS / BLOQUEIOS ─────────────────────────────────────────────────────

const HORA_ABERTURA = 9;
const HORA_FECHAMENTO = 19;

function TabHorarios() {
  const [bloqueios, setBloqueios] = useState([]);
  const [agendamentos, setAgendamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [form, setForm] = useState({ inicio: '', fim: '', motivo: '' });
  const [saving, setSaving] = useState(false);
  const [dataVisu, setDataVisu] = useState(new Date().toISOString().slice(0, 10));

  async function carregar() {
    setLoading(true); setErro('');
    try {
      const [bl, ag] = await Promise.all([listarBloqueios(), listarAgendamentos()]);
      setBloqueios(bl); setAgendamentos(ag);
    } catch (e) { setErro(e.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { carregar(); }, []);

  async function handleCriar(e) {
    e.preventDefault();
    if (!form.inicio || !form.fim) { setErro('Informe início e fim'); return; }
    setSaving(true); setErro(''); setSucesso('');
    try {
      await criarBloqueio({ inicio: form.inicio, fim: form.fim, motivo: form.motivo || undefined });
      setForm({ inicio: '', fim: '', motivo: '' });
      setSucesso('Bloqueio criado com sucesso!');
      carregar();
    } catch (e) { setErro(e.message); }
    finally { setSaving(false); }
  }

  async function handleRemover(id) {
    if (!confirm('Remover este bloqueio?')) return;
    try { await removerBloqueio(id); carregar(); }
    catch (e) { setErro(e.message); }
  }

  // Grade visual do dia
  const horasGrade = Array.from({ length: (HORA_FECHAMENTO - HORA_ABERTURA) * 2 }, (_, i) => {
    const totalMin = HORA_ABERTURA * 60 + i * 30;
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  });

  const agDia = agendamentos.filter(a => a.data?.slice(0, 10) === dataVisu && a.status !== 'cancelado');
  const bloqDia = bloqueios.filter(b => {
    const bi = new Date(b.inicio).toISOString().slice(0, 10);
    const bf = new Date(b.fim).toISOString().slice(0, 10);
    return bi <= dataVisu && bf >= dataVisu;
  });

  function getSlotStatus(hora) {
    const [h, m] = hora.split(':').map(Number);
    const slotMin = h * 60 + m;
    const slotFimMin = slotMin + 30;
    const bloqueado = bloqDia.some(b => {
      const bi = new Date(b.inicio); const bf = new Date(b.fim);
      const bMin = bi.getHours() * 60 + bi.getMinutes();
      const bfMin = bf.getHours() * 60 + bf.getMinutes();
      return slotMin < bfMin && slotFimMin > bMin;
    });
    if (bloqueado) return 'bloqueado';
    const agendado = agDia.find(a => {
      const ad = new Date(a.data);
      const aMin = ad.getHours() * 60 + ad.getMinutes();
      const duracao = a.servico?.duracao || 60;
      return slotMin >= aMin && slotMin < aMin + duracao;
    });
    if (agendado) return agendado;
    return 'livre';
  }

  return (
    <div className="crm-section horarios-grid">
      {/* Grade visual */}
      <div className="horario-grade-card">
        <div className="horario-grade-header">
          <h3>Grade do dia</h3>
          <input type="date" className="crm-input" value={dataVisu} onChange={e => setDataVisu(e.target.value)} />
        </div>
        <div className="horario-legenda">
          <span className="leg leg--livre">Livre</span>
          <span className="leg leg--agendado">Agendado</span>
          <span className="leg leg--bloqueado">Bloqueado</span>
        </div>
        {loading ? <div className="crm-loading"><div className="crm-spinner" /></div> : (
          <div className="slot-grade">
            {horasGrade.map(hora => {
              const status = getSlotStatus(hora);
              const isObj = typeof status === 'object';
              const tipo = isObj ? 'agendado' : status;
              return (
                <div key={hora} className={`slot-cell slot--${tipo}`}>
                  <span className="slot-hora">{hora}</span>
                  {isObj && (
                    <span className="slot-info">
                      <strong>{status.nomeCliente}</strong> · {status.servico?.nome}
                    </span>
                  )}
                  {tipo === 'bloqueado' && <span className="slot-info">Bloqueado</span>}
                </div>
              );
            })}
          </div>
        )}
        <div className="horario-resumo">
          <span>✅ {agDia.length} agendamento{agDia.length !== 1 ? 's' : ''}</span>
          <span>🔒 {bloqDia.length} bloqueio{bloqDia.length !== 1 ? 's' : ''}</span>
          <span>🟢 {horasGrade.length - agDia.length - bloqDia.length} slots livres (aprox.)</span>
        </div>
      </div>

      {/* Form de bloqueio */}
      <div className="bloqueio-form-card">
        <h3>Bloquear horário</h3>
        <p className="crm-desc">Bloqueios impedem novos agendamentos no período.</p>
        <form onSubmit={handleCriar} className="crm-form-stack">
          <label className="crm-label">Início
            <input className="crm-input" type="datetime-local" value={form.inicio} onChange={e => setForm({ ...form, inicio: e.target.value })} />
          </label>
          <label className="crm-label">Fim
            <input className="crm-input" type="datetime-local" value={form.fim} onChange={e => setForm({ ...form, fim: e.target.value })} />
          </label>
          <label className="crm-label">Motivo (opcional)
            <input className="crm-input" type="text" placeholder="Ex: Feriado, compromisso..." value={form.motivo} onChange={e => setForm({ ...form, motivo: e.target.value })} />
          </label>
          {erro && <div className="crm-alert crm-alert--error">{erro}</div>}
          {sucesso && <div className="crm-alert crm-alert--success">{sucesso}</div>}
          <button className="crm-btn primary" type="submit" disabled={saving}>{saving ? 'Salvando...' : '🔒 Bloquear'}</button>
        </form>

        <h4 style={{ marginTop: '1.5rem', marginBottom: '0.75rem', color: '#2c1810' }}>Bloqueios ativos</h4>
        {loading ? <div className="crm-loading"><div className="crm-spinner" /></div> : bloqueios.length === 0 ? (
          <div className="crm-empty">Nenhum bloqueio ativo.</div>
        ) : (
          <div className="bloqueio-list">
            {bloqueios.map(b => (
              <div key={b.id} className="bloqueio-item">
                <div className="bloqueio-info">
                  <span className="bloqueio-periodo">
                    {new Date(b.inicio).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })} →{' '}
                    {new Date(b.fim).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                  </span>
                  {b.motivo && <span className="bloqueio-motivo">{b.motivo}</span>}
                </div>
                <button className="crm-btn danger-outline tiny" onClick={() => handleRemover(b.id)}>Remover</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── SERVIÇOS ─────────────────────────────────────────────────────────────────

function TabServicos() {
  const [servicos, setServicos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [form, setForm] = useState({ nome: '', preco: '', duracao: '', ativo: true });
  const [editando, setEditando] = useState(null);
  const [saving, setSaving] = useState(false);

  async function carregar() {
    setLoading(true); setErro('');
    try { setServicos(await listarServicosAdmin()); }
    catch (e) { setErro(e.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { carregar(); }, []);

  function iniciarEdicao(s) {
    setEditando(s.id);
    setForm({ nome: s.nome, preco: String(s.preco), duracao: String(s.duracao), ativo: s.ativo });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function cancelarEdicao() { setEditando(null); setForm({ nome: '', preco: '', duracao: '', ativo: true }); }

  async function salvar(e) {
    e.preventDefault(); setSaving(true); setErro(''); setSucesso('');
    try {
      const dados = { nome: form.nome.trim(), preco: Number(form.preco), duracao: Number(form.duracao), ativo: form.ativo };
      if (editando) { await atualizarServico(editando, dados); setSucesso('✅ Serviço atualizado!'); }
      else { await criarServico(dados); setSucesso('✅ Serviço criado!'); }
      cancelarEdicao(); carregar();
    } catch (e) { setErro(e.message); }
    finally { setSaving(false); }
  }

  async function desativar(id) {
    if (!confirm('Desativar este serviço?')) return;
    try { await desativarServico(id); carregar(); }
    catch (e) { setErro(e.message); }
  }

  return (
    <div className="crm-section servicos-grid">
      <div className="servico-form-card">
        <h3>{editando ? '✏️ Editar Serviço' : '➕ Novo Serviço'}</h3>
        <form onSubmit={salvar} className="crm-form-stack">
          <label className="crm-label">Nome do serviço
            <input className="crm-input" type="text" placeholder="Ex: Unhas em gel" value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} required />
          </label>
          <label className="crm-label">Preço (R$)
            <input className="crm-input" type="number" min="0" step="0.01" placeholder="35.00" value={form.preco} onChange={e => setForm({ ...form, preco: e.target.value })} required />
          </label>
          <label className="crm-label">Duração (minutos)
            <input className="crm-input" type="number" min="1" placeholder="60" value={form.duracao} onChange={e => setForm({ ...form, duracao: e.target.value })} required />
          </label>
          <label className="crm-label-check">
            <input type="checkbox" checked={form.ativo} onChange={e => setForm({ ...form, ativo: e.target.checked })} />
            Serviço ativo (visível para clientes)
          </label>
          {erro && <div className="crm-alert crm-alert--error">{erro}</div>}
          {sucesso && <div className="crm-alert crm-alert--success">{sucesso}</div>}
          <div className="crm-form-btns">
            <button className="crm-btn primary" type="submit" disabled={saving}>
              {saving ? 'Salvando...' : editando ? 'Salvar alterações' : '+ Criar serviço'}
            </button>
            {editando && <button className="crm-btn ghost" type="button" onClick={cancelarEdicao}>Cancelar</button>}
          </div>
        </form>
      </div>

      <div className="servicos-lista">
        <h3 style={{ marginBottom: '1rem', color: '#2c1810' }}>Serviços cadastrados</h3>
        {loading ? <div className="crm-loading"><div className="crm-spinner" />Carregando...</div> : (
          <div className="servico-cards">
            {servicos.map(s => (
              <div key={s.id} className={`servico-card${!s.ativo ? ' servico-card--inativo' : ''}`}>
                <div className="servico-card-top">
                  <span className="servico-nome">{s.nome}</span>
                  <span className={`servico-badge ${s.ativo ? 'badge--ativo' : 'badge--inativo'}`}>{s.ativo ? 'Ativo' : 'Inativo'}</span>
                </div>
                <div className="servico-card-stats">
                  <div className="servico-stat">
                    <span className="servico-stat-label">Preço</span>
                    <span className="servico-stat-value">R$ {Number(s.preco).toFixed(2).replace('.',',')}</span>
                  </div>
                  <div className="servico-stat">
                    <span className="servico-stat-label">Duração</span>
                    <span className="servico-stat-value">{s.duracao} min</span>
                  </div>
                  <div className="servico-stat">
                    <span className="servico-stat-label">Criado em</span>
                    <span className="servico-stat-value">{new Date(s.criadoEm).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
                <div className="servico-card-actions">
                  <button className="crm-btn outline small" onClick={() => iniciarEdicao(s)}>✏️ Editar</button>
                  {s.ativo && <button className="crm-btn danger-outline small" onClick={() => desativar(s.id)}>Desativar</button>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
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
  const [tab, setTab] = useState('agendamentos');

  return (
    <div className="admin-wrap">
      <header className="admin-header">
        <div className="admin-header-left">
          <svg width="32" height="32" viewBox="0 0 40 40" fill="none" aria-label="HSBeauty">
            <circle cx="20" cy="20" r="20" fill="#b5936a"/>
            <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle" fill="#fff" fontSize="16" fontWeight="bold" fontFamily="serif">HS</text>
          </svg>
          <span className="admin-brand">HSBeauty Admin</span>
        </div>
        <nav className="admin-nav">
          <button className={`admin-nav-btn${tab === 'agendamentos' ? ' active' : ''}`} onClick={() => setTab('agendamentos')}>Agendamentos</button>
          <button className={`admin-nav-btn${tab === 'bloqueios' ? ' active' : ''}`} onClick={() => setTab('bloqueios')}>Bloqueios</button>
          <button className={`admin-nav-btn${tab === 'servicos' ? ' active' : ''}`} onClick={() => setTab('servicos')}>Serviços</button>
        </nav>
        <div className="admin-header-right">
          <span className="admin-email">{admin?.email}</span>
          <button className="admin-btn outline small" onClick={onLogout}>Sair</button>
        </div>
      </header>

      <main className="admin-main">
        {tab === 'agendamentos' && <TabAgendamentos />}
        {tab === 'bloqueios' && <TabBloqueios />}
        {tab === 'servicos' && <TabServicos />}
      </main>
    </div>
  );
}

// ─── Tab Agendamentos ─────────────────────────────────────────────────────────

function TabAgendamentos() {
  const [agendamentos, setAgendamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [filtro, setFiltro] = useState('');
  const [editando, setEditando] = useState(null);
  const [editStatus, setEditStatus] = useState('');
  const [saving, setSaving] = useState(false);

  async function carregar() {
    setLoading(true);
    setErro('');
    try {
      const data = await listarAgendamentos();
      setAgendamentos(data);
    } catch (e) {
      setErro(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { carregar(); }, []);

  async function salvarStatus(id) {
    setSaving(true);
    try {
      await atualizarAgendamento(id, { status: editStatus });
      setEditando(null);
      carregar();
    } catch (e) {
      setErro(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function cancelar(id) {
    if (!confirm('Cancelar este agendamento?')) return;
    try {
      await atualizarAgendamento(id, { status: 'cancelado' });
      carregar();
    } catch (e) {
      setErro(e.message);
    }
  }

  async function excluir(id) {
    if (!confirm('Excluir permanentemente este agendamento?')) return;
    try {
      await excluirAgendamento(id);
      carregar();
    } catch (e) {
      setErro(e.message);
    }
  }

  const filtrados = agendamentos.filter((a) => {
    if (!filtro) return true;
    const f = filtro.toLowerCase();
    return (
      a.nomeCliente?.toLowerCase().includes(f) ||
      a.telefone?.includes(f) ||
      a.servico?.nome?.toLowerCase().includes(f) ||
      a.status?.toLowerCase().includes(f)
    );
  });

  const statusColor = { pendente: '#f59e0b', confirmado: '#10b981', cancelado: '#ef4444', concluido: '#6366f1' };

  return (
    <section className="admin-section">
      <div className="admin-section-header">
        <h2>Agendamentos <span className="admin-count">{filtrados.length}</span></h2>
        <div className="admin-section-actions">
          <input
            className="admin-search"
            type="search"
            placeholder="Buscar por nome, telefone, serviço..."
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
          />
          <button className="admin-btn outline small" onClick={carregar}>↺ Atualizar</button>
        </div>
      </div>

      {erro && <p className="admin-erro">{erro}</p>}

      {loading ? (
        <div className="admin-loading">Carregando...</div>
      ) : filtrados.length === 0 ? (
        <div className="admin-empty">Nenhum agendamento encontrado.</div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Cliente</th>
                <th>Telefone</th>
                <th>Serviço</th>
                <th>Data/Hora</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((a) => (
                <tr key={a.id}>
                  <td className="admin-td-id">{a.id}</td>
                  <td>{a.nomeCliente}</td>
                  <td>
                    <a href={`https://wa.me/55${a.telefone?.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" className="admin-wpp-link">
                      {a.telefone}
                    </a>
                  </td>
                  <td>{a.servico?.nome || '—'}</td>
                  <td className="admin-td-date">
                    {a.data ? new Date(a.data).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '—'}
                  </td>
                  <td>
                    {editando === a.id ? (
                      <div className="admin-status-edit">
                        <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)} className="admin-select-sm">
                          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <button className="admin-btn primary tiny" onClick={() => salvarStatus(a.id)} disabled={saving}>Salvar</button>
                        <button className="admin-btn outline tiny" onClick={() => setEditando(null)}>Cancelar</button>
                      </div>
                    ) : (
                      <span
                        className="admin-status-badge"
                        style={{ background: statusColor[a.status] || '#888' }}
                        onClick={() => { setEditando(a.id); setEditStatus(a.status); }}
                        title="Clique para editar"
                      >
                        {a.status}
                      </span>
                    )}
                  </td>
                  <td className="admin-td-actions">
                    {a.status !== 'cancelado' && (
                      <button className="admin-btn danger tiny" onClick={() => cancelar(a.id)}>Cancelar</button>
                    )}
                    <button className="admin-btn danger-outline tiny" onClick={() => excluir(a.id)}>Excluir</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

// ─── Tab Bloqueios ────────────────────────────────────────────────────────────

function TabBloqueios() {
  const [bloqueios, setBloqueios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [form, setForm] = useState({ inicio: '', fim: '', motivo: '' });
  const [saving, setSaving] = useState(false);
  const [sucesso, setSucesso] = useState('');

  async function carregar() {
    setLoading(true);
    setErro('');
    try {
      const data = await listarBloqueios();
      setBloqueios(data);
    } catch (e) {
      setErro(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { carregar(); }, []);

  async function handleCriar(e) {
    e.preventDefault();
    if (!form.inicio || !form.fim) { setErro('Informe início e fim'); return; }
    setSaving(true);
    setErro('');
    setSucesso('');
    try {
      await criarBloqueio({ inicio: form.inicio, fim: form.fim, motivo: form.motivo || undefined });
      setForm({ inicio: '', fim: '', motivo: '' });
      setSucesso('Bloqueio criado com sucesso!');
      carregar();
    } catch (e) {
      setErro(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleRemover(id) {
    if (!confirm('Remover este bloqueio?')) return;
    try {
      await removerBloqueio(id);
      carregar();
    } catch (e) {
      setErro(e.message);
    }
  }

  return (
    <section className="admin-section">
      <h2>Bloqueios de Horário</h2>
      <p className="admin-desc">Bloqueios impedem novos agendamentos no período informado.</p>

      <form onSubmit={handleCriar} className="admin-form-inline">
        <label className="admin-label">
          Início
          <input className="admin-input" type="datetime-local" value={form.inicio} onChange={(e) => setForm({ ...form, inicio: e.target.value })} />
        </label>
        <label className="admin-label">
          Fim
          <input className="admin-input" type="datetime-local" value={form.fim} onChange={(e) => setForm({ ...form, fim: e.target.value })} />
        </label>
        <label className="admin-label">
          Motivo (opcional)
          <input className="admin-input" type="text" placeholder="Ex: Feriado, viagem..." value={form.motivo} onChange={(e) => setForm({ ...form, motivo: e.target.value })} />
        </label>
        <button className="admin-btn primary" type="submit" disabled={saving}>{saving ? 'Salvando...' : '+ Bloquear horário'}</button>
      </form>

      {erro && <p className="admin-erro">{erro}</p>}
      {sucesso && <p className="admin-sucesso">{sucesso}</p>}

      {loading ? (
        <div className="admin-loading">Carregando...</div>
      ) : bloqueios.length === 0 ? (
        <div className="admin-empty">Nenhum bloqueio ativo.</div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr><th>#</th><th>Início</th><th>Fim</th><th>Motivo</th><th>Ações</th></tr>
            </thead>
            <tbody>
              {bloqueios.map((b) => (
                <tr key={b.id}>
                  <td className="admin-td-id">{b.id}</td>
                  <td>{new Date(b.inicio).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</td>
                  <td>{new Date(b.fim).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</td>
                  <td>{b.motivo || <em style={{color:'#aaa'}}>—</em>}</td>
                  <td>
                    <button className="admin-btn danger-outline tiny" onClick={() => handleRemover(b.id)}>Remover</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

// ─── Tab Serviços ─────────────────────────────────────────────────────────────

function TabServicos() {
  const [servicos, setServicos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [form, setForm] = useState({ nome: '', preco: '', duracao: '', ativo: true });
  const [editando, setEditando] = useState(null);
  const [saving, setSaving] = useState(false);

  async function carregar() {
    setLoading(true);
    setErro('');
    try {
      const data = await listarServicosAdmin();
      setServicos(data);
    } catch (e) {
      setErro(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { carregar(); }, []);

  function iniciarEdicao(s) {
    setEditando(s.id);
    setForm({ nome: s.nome, preco: String(s.preco), duracao: String(s.duracao), ativo: s.ativo });
  }

  function cancelarEdicao() {
    setEditando(null);
    setForm({ nome: '', preco: '', duracao: '', ativo: true });
  }

  async function salvar(e) {
    e.preventDefault();
    setSaving(true);
    setErro('');
    setSucesso('');
    try {
      const dados = {
        nome: form.nome.trim(),
        preco: Number(form.preco),
        duracao: Number(form.duracao),
        ativo: form.ativo,
      };
      if (editando) {
        await atualizarServico(editando, dados);
        setSucesso('Serviço atualizado!');
      } else {
        await criarServico(dados);
        setSucesso('Serviço criado!');
      }
      cancelarEdicao();
      carregar();
    } catch (e) {
      setErro(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function desativar(id) {
    if (!confirm('Desativar este serviço?')) return;
    try {
      await desativarServico(id);
      carregar();
    } catch (e) {
      setErro(e.message);
    }
  }

  return (
    <section className="admin-section">
      <h2>{editando ? 'Editar Serviço' : 'Serviços'}</h2>

      <form onSubmit={salvar} className="admin-form-inline">
        <label className="admin-label">
          Nome
          <input className="admin-input" type="text" placeholder="Ex: Unhas em gel" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required />
        </label>
        <label className="admin-label">
          Preço (R$)
          <input className="admin-input" type="number" min="0" step="0.01" placeholder="35.00" value={form.preco} onChange={(e) => setForm({ ...form, preco: e.target.value })} required />
        </label>
        <label className="admin-label">
          Duração (min)
          <input className="admin-input" type="number" min="1" placeholder="60" value={form.duracao} onChange={(e) => setForm({ ...form, duracao: e.target.value })} required />
        </label>
        <label className="admin-label admin-label-check">
          <input type="checkbox" checked={form.ativo} onChange={(e) => setForm({ ...form, ativo: e.target.checked })} />
          Ativo
        </label>
        <div className="admin-form-btns">
          <button className="admin-btn primary" type="submit" disabled={saving}>{saving ? 'Salvando...' : editando ? 'Salvar edição' : '+ Criar serviço'}</button>
          {editando && <button className="admin-btn outline" type="button" onClick={cancelarEdicao}>Cancelar</button>}
        </div>
      </form>

      {erro && <p className="admin-erro">{erro}</p>}
      {sucesso && <p className="admin-sucesso">{sucesso}</p>}

      {loading ? (
        <div className="admin-loading">Carregando...</div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr><th>#</th><th>Nome</th><th>Preço</th><th>Duração</th><th>Status</th><th>Ações</th></tr>
            </thead>
            <tbody>
              {servicos.map((s) => (
                <tr key={s.id} style={{ opacity: s.ativo ? 1 : 0.5 }}>
                  <td className="admin-td-id">{s.id}</td>
                  <td>{s.nome}</td>
                  <td>R$ {Number(s.preco).toFixed(2).replace('.', ',')}</td>
                  <td>{s.duracao} min</td>
                  <td>
                    <span className="admin-status-badge" style={{ background: s.ativo ? '#10b981' : '#888' }}>
                      {s.ativo ? 'ativo' : 'inativo'}
                    </span>
                  </td>
                  <td className="admin-td-actions">
                    <button className="admin-btn outline tiny" onClick={() => iniciarEdicao(s)}>Editar</button>
                    {s.ativo && <button className="admin-btn danger-outline tiny" onClick={() => desativar(s.id)}>Desativar</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

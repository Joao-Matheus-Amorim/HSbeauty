import { useEffect, useState } from 'react';
import {
  loginAdmin,
  listarAgendamentos,
  atualizarAgendamento,
  excluirAgendamento,
  listarServicosAdmin,
  criarServico,
  atualizarServico,
  desativarServico,
  listarBloqueios,
  criarBloqueio,
  removerBloqueio,
} from '../services/agendamentos';
import './Admin.css';

function formatDT(dt) {
  return new Date(dt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

export default function Admin() {
  const [token, setToken] = useState(() => sessionStorage.getItem('hs_token') || '');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginSenha, setLoginSenha] = useState('');
  const [loginErro, setLoginErro] = useState('');
  const [aba, setAba] = useState('agendamentos');

  // Agendamentos
  const [agendamentos, setAgendamentos] = useState([]);
  const [agLoading, setAgLoading] = useState(false);

  // Serviços
  const [servicos, setServicos] = useState([]);
  const [svLoading, setSvLoading] = useState(false);
  const [svForm, setSvForm] = useState({ nome: '', preco: '', duracao: '' });
  const [svEditing, setSvEditing] = useState(null);
  const [svErro, setSvErro] = useState('');

  // Bloqueios
  const [bloqueios, setBloqueios] = useState([]);
  const [blForm, setBlForm] = useState({ inicio: '', fim: '', motivo: '' });
  const [blErro, setBlErro] = useState('');

  async function doLogin(e) {
    e.preventDefault();
    setLoginErro('');
    try {
      const res = await loginAdmin(loginEmail, loginSenha);
      sessionStorage.setItem('hs_token', res.token);
      setToken(res.token);
    } catch (err) {
      setLoginErro(err.message);
    }
  }

  function logout() {
    sessionStorage.removeItem('hs_token');
    setToken('');
  }

  // ─── Carregar dados ──────────────────────────────────────────────────────────

  useEffect(() => {
    if (!token) return;
    if (aba === 'agendamentos') loadAgendamentos();
    if (aba === 'servicos') loadServicos();
    if (aba === 'bloqueios') loadBloqueios();
  }, [token, aba]);

  async function loadAgendamentos() {
    setAgLoading(true);
    try { setAgendamentos(await listarAgendamentos()); }
    catch { setAgendamentos([]); }
    finally { setAgLoading(false); }
  }

  async function loadServicos() {
    setSvLoading(true);
    try { setServicos(await listarServicosAdmin()); }
    catch { setServicos([]); }
    finally { setSvLoading(false); }
  }

  async function loadBloqueios() {
    try { setBloqueios(await listarBloqueios()); }
    catch { setBloqueios([]); }
  }

  // ─── Agendamentos ────────────────────────────────────────────────────────────

  async function confirmar(id) {
    try { await atualizarAgendamento(id, { status: 'confirmado' }); await loadAgendamentos(); }
    catch (e) { alert(e.message); }
  }

  async function cancelar(id) {
    try { await atualizarAgendamento(id, { status: 'cancelado' }); await loadAgendamentos(); }
    catch (e) { alert(e.message); }
  }

  async function excluir(id) {
    if (!confirm('Excluir agendamento?')) return;
    try { await excluirAgendamento(id); await loadAgendamentos(); }
    catch (e) { alert(e.message); }
  }

  // ─── Serviços ────────────────────────────────────────────────────────────────

  async function salvarServico(e) {
    e.preventDefault();
    setSvErro('');
    try {
      const dados = { nome: svForm.nome, preco: Number(svForm.preco), duracao: Number(svForm.duracao) };
      if (svEditing) {
        await atualizarServico(svEditing, dados);
      } else {
        await criarServico(dados);
      }
      setSvForm({ nome: '', preco: '', duracao: '' });
      setSvEditing(null);
      await loadServicos();
    } catch (err) {
      setSvErro(err.message);
    }
  }

  function editarServico(s) {
    setSvEditing(s.id);
    setSvForm({ nome: s.nome, preco: String(s.preco), duracao: String(s.duracao) });
  }

  async function desativar(id) {
    if (!confirm('Desativar serviço?')) return;
    try { await desativarServico(id); await loadServicos(); }
    catch (e) { alert(e.message); }
  }

  // ─── Bloqueios ───────────────────────────────────────────────────────────────

  async function criarBloqueioHandler(e) {
    e.preventDefault();
    setBlErro('');
    try {
      await criarBloqueio(blForm);
      setBlForm({ inicio: '', fim: '', motivo: '' });
      await loadBloqueios();
    } catch (err) {
      setBlErro(err.message);
    }
  }

  async function remover(id) {
    try { await removerBloqueio(id); await loadBloqueios(); }
    catch (e) { alert(e.message); }
  }

  // ─── Login screen ────────────────────────────────────────────────────────────

  if (!token) {
    return (
      <div className="admin-login-wrap">
        <form className="admin-login-form" onSubmit={doLogin}>
          <h1 className="admin-login-title">HSBeauty · Admin</h1>
          <p className="admin-login-sub">Acesso restrito</p>
          <label className="admin-label">
            Email
            <input className="admin-input" type="email" required value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} />
          </label>
          <label className="admin-label">
            Senha
            <input className="admin-input" type="password" required value={loginSenha} onChange={(e) => setLoginSenha(e.target.value)} />
          </label>
          {loginErro && <p className="admin-erro">{loginErro}</p>}
          <button className="admin-btn primary" type="submit">Entrar</button>
        </form>
      </div>
    );
  }

  // ─── Painel ──────────────────────────────────────────────────────────────────

  return (
    <div className="admin-wrap">
      <header className="admin-header">
        <h1 className="admin-brand">HSBeauty · Admin</h1>
        <button className="admin-logout" onClick={logout}>Sair</button>
      </header>

      <nav className="admin-tabs">
        {['agendamentos', 'servicos', 'bloqueios'].map((t) => (
          <button
            key={t}
            className={`admin-tab${aba === t ? ' active' : ''}`}
            onClick={() => setAba(t)}
          >
            {{ agendamentos: 'Agendamentos', servicos: 'Serviços', bloqueios: 'Bloqueios' }[t]}
          </button>
        ))}
      </nav>

      {/* ── Agendamentos ── */}
      {aba === 'agendamentos' && (
        <section className="admin-section">
          <div className="admin-section-header">
            <h2>Agendamentos</h2>
            <button className="admin-btn small" onClick={loadAgendamentos}>↺ Atualizar</button>
          </div>
          {agLoading && <p className="admin-info">Carregando...</p>}
          {!agLoading && agendamentos.length === 0 && <p className="admin-info">Nenhum agendamento.</p>}
          <div className="admin-cards">
            {agendamentos.map((ag) => (
              <div key={ag.id} className={`admin-card status-${ag.status}`}>
                <div className="admin-card-top">
                  <strong>{ag.nomeCliente}</strong>
                  <span className={`badge badge-${ag.status}`}>{ag.status}</span>
                </div>
                <p>{ag.servico?.nome} · {formatDT(ag.data)}</p>
                <p className="admin-card-tel">📞 {ag.telefone}</p>
                <div className="admin-card-actions">
                  {ag.status === 'pendente' && (
                    <button className="admin-btn small green" onClick={() => confirmar(ag.id)}>Confirmar</button>
                  )}
                  {ag.status !== 'cancelado' && (
                    <button className="admin-btn small orange" onClick={() => cancelar(ag.id)}>Cancelar</button>
                  )}
                  <button className="admin-btn small red" onClick={() => excluir(ag.id)}>Excluir</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Serviços ── */}
      {aba === 'servicos' && (
        <section className="admin-section">
          <h2>{svEditing ? 'Editar Serviço' : 'Novo Serviço'}</h2>
          <form className="admin-form" onSubmit={salvarServico}>
            <label className="admin-label">Nome
              <input className="admin-input" required value={svForm.nome} onChange={(e) => setSvForm(f => ({ ...f, nome: e.target.value }))} />
            </label>
            <label className="admin-label">Preço (R$)
              <input className="admin-input" type="number" step="0.01" min="0" required value={svForm.preco} onChange={(e) => setSvForm(f => ({ ...f, preco: e.target.value }))} />
            </label>
            <label className="admin-label">Duração (min)
              <input className="admin-input" type="number" min="1" required value={svForm.duracao} onChange={(e) => setSvForm(f => ({ ...f, duracao: e.target.value }))} />
            </label>
            {svErro && <p className="admin-erro">{svErro}</p>}
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="admin-btn primary" type="submit">{svEditing ? 'Salvar' : 'Criar'}</button>
              {svEditing && <button type="button" className="admin-btn" onClick={() => { setSvEditing(null); setSvForm({ nome: '', preco: '', duracao: '' }); }}>Cancelar</button>}
            </div>
          </form>

          <div className="admin-section-header" style={{ marginTop: 24 }}>
            <h2>Serviços cadastrados</h2>
            {svLoading && <span className="admin-info">Carregando...</span>}
          </div>
          <div className="admin-cards">
            {servicos.map((s) => (
              <div key={s.id} className={`admin-card${!s.ativo ? ' inativo' : ''}`}>
                <div className="admin-card-top">
                  <strong>{s.nome}</strong>
                  <span className={`badge ${s.ativo ? 'badge-confirmado' : 'badge-cancelado'}`}>{s.ativo ? 'Ativo' : 'Inativo'}</span>
                </div>
                <p>R$ {Number(s.preco).toFixed(2).replace('.', ',')} · {s.duracao} min</p>
                <div className="admin-card-actions">
                  <button className="admin-btn small" onClick={() => editarServico(s)}>Editar</button>
                  {s.ativo && <button className="admin-btn small orange" onClick={() => desativar(s.id)}>Desativar</button>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Bloqueios ── */}
      {aba === 'bloqueios' && (
        <section className="admin-section">
          <h2>Bloquear horário</h2>
          <form className="admin-form" onSubmit={criarBloqueioHandler}>
            <label className="admin-label">Início
              <input className="admin-input" type="datetime-local" required value={blForm.inicio} onChange={(e) => setBlForm(f => ({ ...f, inicio: e.target.value }))} />
            </label>
            <label className="admin-label">Fim
              <input className="admin-input" type="datetime-local" required value={blForm.fim} onChange={(e) => setBlForm(f => ({ ...f, fim: e.target.value }))} />
            </label>
            <label className="admin-label">Motivo (opcional)
              <input className="admin-input" value={blForm.motivo} onChange={(e) => setBlForm(f => ({ ...f, motivo: e.target.value }))} />
            </label>
            {blErro && <p className="admin-erro">{blErro}</p>}
            <button className="admin-btn primary" type="submit">Criar bloqueio</button>
          </form>

          <h2 style={{ marginTop: 24 }}>Bloqueios ativos</h2>
          {bloqueios.length === 0 && <p className="admin-info">Nenhum bloqueio ativo.</p>}
          <div className="admin-cards">
            {bloqueios.map((b) => (
              <div key={b.id} className="admin-card">
                <div className="admin-card-top">
                  <strong>{b.motivo || 'Sem motivo'}</strong>
                </div>
                <p>{formatDT(b.inicio)} → {formatDT(b.fim)}</p>
                <div className="admin-card-actions">
                  <button className="admin-btn small red" onClick={() => remover(b.id)}>Remover</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

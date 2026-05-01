import { useState } from 'react';
import { loginAdmin } from '../services/agendamentos';
import './Admin.css';

export default function AdminLogin({ onLogin }) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim() || !senha.trim()) {
      setErro('Preencha email e senha');
      return;
    }
    setLoading(true);
    setErro('');
    try {
      const res = await loginAdmin(email.trim(), senha.trim());
      sessionStorage.setItem('hs_token', res.token);
      sessionStorage.setItem('hs_admin', JSON.stringify(res.admin));
      onLogin(res.admin);
    } catch (e) {
      setErro(e.message || 'Credenciais inválidas');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-login-wrap">
      <div className="admin-login-box">
        <div className="admin-logo">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-label="HSBeauty">
            <circle cx="20" cy="20" r="20" fill="#b5936a"/>
            <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle" fill="#fff" fontSize="16" fontWeight="bold" fontFamily="serif">HS</text>
          </svg>
          <span>HSBeauty Admin</span>
        </div>
        <h1 className="admin-login-title">Entrar no painel</h1>
        <form onSubmit={handleSubmit} className="admin-login-form">
          <label className="admin-label">
            Email
            <input
              className="admin-input"
              type="email"
              placeholder="admin@hsbeauty.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
            />
          </label>
          <label className="admin-label">
            Senha
            <input
              className="admin-input"
              type="password"
              placeholder="••••••••"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
            />
          </label>
          {erro && <p className="admin-erro">{erro}</p>}
          <button className="admin-btn primary" type="submit" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
        <a href="/" className="admin-back-link">← Voltar ao site</a>
      </div>
    </div>
  );
}

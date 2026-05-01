import { useState } from 'react';
import AdminLogin from './AdminLogin';
import AdminLayout from '../components/AdminLayout';
import Dashboard from '../components/Dashboard';
import './Admin.css';

function getAdminFromSession() {
  try { return JSON.parse(sessionStorage.getItem('hs_admin')); } catch { return null; }
}

export default function Admin() {
  const [admin, setAdmin] = useState(() => {
    const token = sessionStorage.getItem('hs_token');
    return token ? getAdminFromSession() : null;
  });

  const [tab, setTab] = useState('dashboard');

  if (!admin) return <AdminLogin onLogin={setAdmin} />;

  const handleLogout = () => {
    sessionStorage.removeItem('hs_token');
    sessionStorage.removeItem('hs_admin');
    setAdmin(null);
  };

  return (
    <AdminLayout 
      admin={admin} 
      activeTab={tab} 
      onTabChange={setTab} 
      onLogout={handleLogout}
    >
      {tab === 'dashboard' && <Dashboard onNavigate={setTab} />}
      {tab === 'agendamentos' && <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-gray-300 text-gray-400">Em implementação: Gestão de Agendamentos</div>}
      {tab === 'horarios' && <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-gray-300 text-gray-400">Em implementação: Gestão de Horários</div>}
      {tab === 'servicos' && <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-gray-300 text-gray-400">Em implementação: Gestão de Serviços</div>}
    </AdminLayout>
  );
}

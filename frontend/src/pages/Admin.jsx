import { useEffect, useState } from 'react';
import AdminLogin from './AdminLogin';
import AdminLayout from '../components/AdminLayout';
import Dashboard from '../components/Dashboard';
import AppointmentManager from '../components/AppointmentManager';
import ServiceManager from '../components/ServiceManager';
import ComboManager from '../components/ComboManager';
import ScheduleManager from '../components/ScheduleManager';
import { getAccessToken, getAdminFromSession, logoutAdmin } from '../services/auth';
import { listarAgendamentosAdmin } from '../services/admin';
import './Admin.css';
import './AdminMobile.css';
import './AdminAppointmentsMobile.css';

const POLL_INTERVAL_MS = 30_000;

export default function Admin() {
  const [admin, setAdmin] = useState(() => (getAccessToken() ? getAdminFromSession() : null));
  const [tab, setTab] = useState('agendamentos');
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    function handleAuthCleared() {
      setAdmin(null);
    }

    window.addEventListener('hs-auth-cleared', handleAuthCleared);
    return () => window.removeEventListener('hs-auth-cleared', handleAuthCleared);
  }, []);

  useEffect(() => {
    if (!admin) return;

    let cancelled = false;

    async function checkPending() {
      try {
        const data = await listarAgendamentosAdmin({ status: 'pendente', limit: 1, page: 1 });
        if (!cancelled) setPendingCount(data.paginacao?.total ?? 0);
      } catch {
        // polling errors are silent — não deve interromper o painel
      }
    }

    checkPending();
    const id = setInterval(checkPending, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [admin]);

  if (!admin) return <AdminLogin onLogin={setAdmin} />;

  const handleLogout = async () => {
    await logoutAdmin();
    setAdmin(null);
  };

  return (
    <AdminLayout
      admin={admin}
      activeTab={tab}
      onTabChange={setTab}
      onLogout={handleLogout}
      pendingCount={pendingCount}
    >
      {tab === 'dashboard' && <Dashboard onNavigate={setTab} />}
      {tab === 'agendamentos' && <AppointmentManager />}
      {tab === 'horarios' && <ScheduleManager />}
      {tab === 'servicos' && <ServiceManager />}
      {tab === 'combos' && <ComboManager />}
    </AdminLayout>
  );
}

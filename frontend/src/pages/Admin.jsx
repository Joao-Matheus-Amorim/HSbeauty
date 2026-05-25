import { useEffect, useState } from 'react';
import AdminLogin from './AdminLogin';
import AdminLayout from '../components/AdminLayout';
import Dashboard from '../components/Dashboard';
import AppointmentManager from '../components/AppointmentManager';
import ServiceManager from '../components/ServiceManager';
import ScheduleManager from '../components/ScheduleManager';
import { getAccessToken, getAdminFromSession, logoutAdmin } from '../services/auth';
import './Admin.css';
import './AdminMobile.css';
import './AdminAppointmentsMobile.css';

export default function Admin() {
  const [admin, setAdmin] = useState(() => (getAccessToken() ? getAdminFromSession() : null));
  const [tab, setTab] = useState('agendamentos');

  useEffect(() => {
    function handleAuthCleared() {
      setAdmin(null);
    }

    window.addEventListener('hs-auth-cleared', handleAuthCleared);
    return () => window.removeEventListener('hs-auth-cleared', handleAuthCleared);
  }, []);

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
    >
      {tab === 'dashboard' && <Dashboard onNavigate={setTab} />}
      {tab === 'agendamentos' && <AppointmentManager />}
      {tab === 'horarios' && <ScheduleManager />}
      {tab === 'servicos' && <ServiceManager />}
    </AdminLayout>
  );
}

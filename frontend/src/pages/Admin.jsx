import { useState } from 'react';
import AdminLogin from './AdminLogin';
import AdminLayout from '../components/AdminLayout';
import Dashboard from '../components/Dashboard';
import AppointmentManager from '../components/AppointmentManager';
import ServiceManager from '../components/ServiceManager';
import ScheduleManager from '../components/ScheduleManager';
import './Admin.css';
import './AdminMobile.css';
import './AdminAppointmentsMobile.css';

function getAdminFromSession() {
  try { return JSON.parse(sessionStorage.getItem('hs_admin')); } catch { return null; }
}

export default function Admin() {
  const [admin, setAdmin] = useState(() => {
    const token = sessionStorage.getItem('hs_token');
    return token ? getAdminFromSession() : null;
  });

  const [tab, setTab] = useState('agendamentos');

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
      {tab === 'agendamentos' && <AppointmentManager />}
      {tab === 'horarios' && <ScheduleManager />}
      {tab === 'servicos' && <ServiceManager />}
    </AdminLayout>
  );
}

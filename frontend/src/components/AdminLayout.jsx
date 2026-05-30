import React, { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  Calendar,
  Clock,
  Scissors,
  Package,
  Settings,
  LogOut,
  Menu,
  X,
  FolderTree,
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export default function AdminLayout({ children, activeTab, onTabChange, admin, onLogout, pendingCount = 0 }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const menuItems = [
    { id: 'agendamentos', label: 'Agenda', desktopLabel: 'Agendamentos', icon: Calendar },
    { id: 'horarios', label: 'Horários', desktopLabel: 'Horários', icon: Clock },
    { id: 'categorias', label: 'Categorias', desktopLabel: 'Categorias', icon: FolderTree },
    { id: 'servicos', label: 'Serviços', desktopLabel: 'Serviços', icon: Scissors },
    { id: 'combos', label: 'Combos', desktopLabel: 'Combos', icon: Package },
    { id: 'configuracoes', label: 'Site', desktopLabel: 'Configurações', icon: Settings },
    { id: 'dashboard', label: 'Resumo', desktopLabel: 'Resumo', icon: LayoutDashboard },
  ];

  const activeItem = menuItems.find((item) => item.id === activeTab);

  useEffect(() => {
    if (mobileOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
    return undefined;
  }, [mobileOpen]);

  function handleTabChange(id) {
    onTabChange(id);
    setMobileOpen(false);
  }

  return (
    <div className="min-h-screen bg-[#f8f5f2] font-sans text-[#2c1810] md:flex admin-shell">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex w-64 flex-col bg-[#1e0f07] text-white sticky top-0 h-screen overflow-hidden">
        <div className="p-6 flex items-center gap-3 border-b border-white/10">
          <div className="w-10 h-10 bg-[#b5936a] rounded-xl flex items-center justify-center font-serif text-xl font-bold shadow-lg shadow-black/20">HS</div>
          <div>
            <span className="block text-xl font-bold tracking-tight">HSBeauty</span>
            <span className="text-xs text-[#a08060]">Painel administrativo</span>
          </div>
        </div>

        <nav className="flex-1 p-4 flex flex-col gap-2 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const badge = item.id === 'agendamentos' && activeTab !== 'agendamentos' && pendingCount > 0;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-left',
                  activeTab === item.id
                    ? 'bg-[#b5936a] text-white shadow-lg shadow-[#b5936a]/20'
                    : 'text-[#a08060] hover:bg-white/5 hover:text-[#e8c99a]'
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.desktopLabel}</span>
                {badge && (
                  <span className="ml-auto bg-rose-500 text-white text-xs font-bold rounded-full min-w-[1.25rem] h-5 flex items-center justify-center px-1">
                    {pendingCount > 99 ? '99+' : pendingCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#b5936a] flex items-center justify-center font-bold text-sm shrink-0">
            {admin?.email?.[0]?.toUpperCase() || 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{admin?.nome || 'Admin'}</p>
            <p className="text-xs text-[#a08060] truncate">{admin?.email}</p>
          </div>
          <button
            onClick={onLogout}
            className="p-2 text-[#a08060] hover:text-red-400 transition-colors rounded-lg hover:bg-white/5"
            title="Sair"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="admin-mobile-header md:hidden">
        <div className="admin-mobile-header-info">
          <span className="admin-mobile-eyebrow">HSBeauty</span>
          <h1>{activeItem?.desktopLabel || 'Painel'}</h1>
          <p>{admin?.email}</p>
        </div>
        <button
          type="button"
          className="admin-mobile-menu-btn"
          onClick={() => setMobileOpen(true)}
          aria-label="Abrir menu"
          aria-expanded={mobileOpen}
        >
          <Menu className="w-6 h-6" />
          {pendingCount > 0 && activeTab !== 'agendamentos' && (
            <span className="admin-mobile-menu-badge">{pendingCount > 99 ? '99+' : pendingCount}</span>
          )}
        </button>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="admin-mobile-drawer md:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <button
            type="button"
            className="admin-mobile-drawer-backdrop"
            onClick={() => setMobileOpen(false)}
            aria-label="Fechar menu"
          />
          <aside className="admin-mobile-drawer-panel" aria-label="Menu do painel">
            <header className="admin-mobile-drawer-head">
              <div>
                <span className="admin-mobile-drawer-eyebrow">HSBeauty</span>
                <p className="admin-mobile-drawer-email">{admin?.email}</p>
              </div>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="admin-mobile-drawer-close"
                aria-label="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </header>

            <nav className="admin-mobile-drawer-nav">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                const badge = item.id === 'agendamentos' && activeTab !== 'agendamentos' && pendingCount > 0;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleTabChange(item.id)}
                    className={cn('admin-mobile-drawer-item', isActive && 'is-active')}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.desktopLabel}</span>
                    {badge && (
                      <span className="admin-mobile-drawer-badge">
                        {pendingCount > 99 ? '99+' : pendingCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            <button
              type="button"
              onClick={() => { onLogout(); setMobileOpen(false); }}
              className="admin-mobile-drawer-logout"
            >
              <LogOut className="w-5 h-5" />
              <span>Sair</span>
            </button>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 min-w-0 admin-main">
        <header className="hidden md:flex h-20 items-center justify-between px-8 bg-white border-b border-[#ede8e1] sticky top-0 z-30">
          <div>
            <h1 className="text-2xl font-bold capitalize">{activeItem?.desktopLabel}</h1>
            <p className="text-sm text-gray-400">
              {new Date().toLocaleDateString('pt-BR', {
                weekday: 'long',
                day: '2-digit',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>
        </header>

        <div className="admin-content">
          {children}
        </div>
      </main>
    </div>
  );
}

import React from 'react';
import {
  LayoutDashboard,
  Calendar,
  Clock,
  Scissors,
  LogOut,
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export default function AdminLayout({ children, activeTab, onTabChange, admin, onLogout }) {
  const menuItems = [
    { id: 'dashboard', label: 'Início', desktopLabel: 'Dashboard', icon: LayoutDashboard },
    { id: 'agendamentos', label: 'Agenda', desktopLabel: 'Agendamentos', icon: Calendar },
    { id: 'horarios', label: 'Horários', desktopLabel: 'Horários', icon: Clock },
    { id: 'servicos', label: 'Serviços', desktopLabel: 'Serviços', icon: Scissors },
  ];

  const activeItem = menuItems.find((item) => item.id === activeTab);

  return (
    <div className="min-h-screen bg-[#f8f5f2] font-sans text-[#2c1810] md:flex">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex w-64 flex-col bg-[#1e0f07] text-white sticky top-0 h-screen overflow-hidden">
        <div className="p-6 flex items-center gap-3 border-b border-white/10">
          <div className="w-10 h-10 bg-[#b5936a] rounded-xl flex items-center justify-center font-serif text-xl font-bold shadow-lg shadow-black/20">HS</div>
          <div>
            <span className="block text-xl font-bold tracking-tight">HSBeauty</span>
            <span className="text-xs text-[#a08060]">Painel administrativo</span>
          </div>
        </div>

        <nav className="flex-1 p-4 flex flex-col gap-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
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
      <header className="md:hidden fixed top-0 left-0 right-0 z-40 bg-[#1e0f07] text-white border-b border-white/10">
        <div className="h-16 px-4 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 bg-[#b5936a] rounded-xl flex items-center justify-center font-serif font-bold shrink-0">HS</div>
            <div className="min-w-0">
              <p className="font-bold leading-tight">{activeItem?.desktopLabel || 'Painel'}</p>
              <p className="text-xs text-[#a08060] truncate">{admin?.email}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="h-10 w-10 rounded-xl bg-white/5 text-[#e8c99a] flex items-center justify-center active:scale-95"
            aria-label="Sair"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 min-w-0 pt-16 pb-24 md:pt-0 md:pb-0">
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

        <div className="p-3 sm:p-4 md:p-8 overflow-x-hidden">
          {children}
        </div>
      </main>

      {/* Mobile bottom navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-[#e5ddd4] bg-white/95 backdrop-blur-xl px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 shadow-[0_-10px_30px_rgba(30,15,7,0.12)]">
        <div className="grid grid-cols-4 gap-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={cn(
                  'min-h-[56px] rounded-2xl flex flex-col items-center justify-center gap-1 text-[11px] font-bold transition-all active:scale-95',
                  isActive ? 'bg-[#1e0f07] text-[#f5d7a0]' : 'text-[#8b735f] hover:bg-[#f8f5f2]'
                )}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

import React from 'react';
import { 
  LayoutDashboard, 
  Calendar, 
  Clock, 
  Scissors, 
  LogOut, 
  Menu, 
  X 
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export default function AdminLayout({ children, activeTab, onTabChange, admin, onLogout }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'agendamentos', label: 'Agendamentos', icon: Calendar },
    { id: 'horarios', label: 'Horários', icon: Clock },
    { id: 'servicos', label: 'Serviços', icon: Scissors },
  ];

  return (
    <div className="flex min-h-screen bg-[#f8f5f2] font-sans text-[#2c1810]">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex w-64 flex-col bg-[#1e0f07] text-white sticky top-0 h-screen overflow-hidden">
        <div className="p-6 flex items-center gap-3 border-b border-white/10">
          <div className="w-10 h-10 bg-[#b5936a] rounded-lg flex items-center justify-center font-serif text-xl font-bold">HS</div>
          <span className="text-xl font-bold tracking-tight">HSBeauty</span>
        </div>
        
        <nav className="flex-1 p-4 flex flex-col gap-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                  activeTab === item.id 
                    ? "bg-[#b5936a] text-white shadow-lg shadow-[#b5936a]/20" 
                    : "text-[#a08060] hover:bg-white/5 hover:text-[#e8c99a]"
                )}
              >
                <Icon className={cn("w-5 h-5", activeTab === item.id ? "text-white" : "group-hover:text-[#e8c99a]")} />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#b5936a] flex items-center justify-center font-bold text-sm">
            {admin?.email?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-width-0">
            <p className="text-sm font-semibold truncate">{admin?.nome || 'Admin'}</p>
            <p className="text-xs text-[#a08060] truncate">{admin?.email}</p>
          </div>
          <button 
            onClick={onLogout}
            className="p-2 text-[#a08060] hover:text-red-400 transition-colors"
            title="Sair"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[#1e0f07] text-white flex items-center justify-between px-4 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#b5936a] rounded flex items-center justify-center font-serif font-bold">HS</div>
          <span className="font-bold">HSBeauty</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2">
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-[#1e0f07] z-40 pt-20 p-6 flex flex-col gap-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onTabChange(item.id);
                  setIsMobileMenuOpen(false);
                }}
                className={cn(
                  "flex items-center gap-4 px-6 py-4 rounded-2xl text-lg font-medium transition-all",
                  activeTab === item.id ? "bg-[#b5936a] text-white" : "text-[#a08060]"
                )}
              >
                <Icon className="w-6 h-6" />
                {item.label}
              </button>
            );
          })}
          <button 
            onClick={onLogout}
            className="mt-auto flex items-center gap-4 px-6 py-4 rounded-2xl text-red-400 font-medium"
          >
            <LogOut className="w-6 h-6" />
            Sair da conta
          </button>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 pt-16 md:pt-0">
        <header className="hidden md:flex h-20 items-center justify-between px-8 bg-white border-b border-[#ede8e1]">
          <div>
            <h1 className="text-2xl font-bold capitalize">
              {menuItems.find(i => i.id === activeTab)?.label}
            </h1>
            <p className="text-sm text-gray-400">
              {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </header>
        
        <div className="flex-1 p-4 md:p-8 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

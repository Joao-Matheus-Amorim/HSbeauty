import React, { useEffect, useState } from 'react';
import { 
  TrendingUp, 
  Users, 
  Calendar, 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  ChevronRight
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { getDashboardStats } from '../services/admin';

export default function Dashboard({ onNavigate }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadStats() {
      try {
        const data = await getDashboardStats();
        setStats(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#b5936a]"></div>
    </div>
  );

  if (error) return (
    <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-3">
      <AlertCircle className="w-5 h-5" />
      <span>{error}</span>
    </div>
  );

  const kpis = [
    { 
      label: 'Agendamentos Hoje', 
      value: stats.resumo.agendamentosHoje, 
      icon: Calendar, 
      color: 'bg-blue-50 text-blue-600',
      sub: 'Novas reservas'
    },
    { 
      label: 'Receita do Mês', 
      value: `R$ ${stats.resumo.receitaMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 
      icon: DollarSign, 
      color: 'bg-green-50 text-green-600',
      sub: 'Concluídos e confirmados'
    },
    { 
      label: 'Serviços Ativos', 
      value: stats.resumo.totalServicos, 
      icon: TrendingUp, 
      color: 'bg-purple-50 text-purple-600',
      sub: 'No catálogo'
    },
    { 
      label: 'Pendentes', 
      value: stats.statusCount.pendente, 
      icon: Clock, 
      color: 'bg-amber-50 text-amber-600',
      sub: 'Aguardando ação',
      clickable: true,
      tab: 'agendamentos'
    }
  ];

  return (
    <div className="space-y-8">
      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, idx) => (
          <div 
            key={idx} 
            onClick={() => kpi.clickable && onNavigate(kpi.tab)}
            className={`bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-start gap-4 ${kpi.clickable ? 'cursor-pointer hover:border-[#b5936a] transition-colors' : ''}`}
          >
            <div className={`p-3 rounded-xl ${kpi.color}`}>
              <kpi.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">{kpi.label}</p>
              <h3 className="text-2xl font-bold mt-1">{kpi.value}</h3>
              <p className="text-xs text-gray-400 mt-1">{kpi.sub}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Status Distribution */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-[#b5936a]" />
            Status dos Agendamentos (Mês)
          </h3>
          <div className="space-y-6">
            {[
              { label: 'Confirmados', count: stats.statusCount.confirmado, color: 'bg-green-500', total: stats.resumo.totalAgendamentos },
              { label: 'Pendentes', count: stats.statusCount.pendente, color: 'bg-amber-500', total: stats.resumo.totalAgendamentos },
              { label: 'Concluídos', count: stats.statusCount.concluido, color: 'bg-purple-500', total: stats.resumo.totalAgendamentos },
              { label: 'Cancelados', count: stats.statusCount.cancelado, color: 'bg-red-500', total: stats.resumo.totalAgendamentos },
            ].map((item, idx) => {
              const percentage = item.total > 0 ? (item.count / item.total) * 100 : 0;
              return (
                <div key={idx} className="space-y-2">
                  <div className="flex justify-between text-sm font-medium">
                    <span className="text-gray-600">{item.label}</span>
                    <span className="text-gray-900 font-bold">{item.count}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${item.color} transition-all duration-1000`} 
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Services Chart */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#b5936a]" />
            Serviços Populares
          </h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.topServicos} layout="vertical" margin={{ left: 20, right: 30 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f0f0f0" />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="nome" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  width={100}
                  tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 500 }}
                />
                <Tooltip 
                  cursor={{ fill: '#f9fafb' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="quantidade" radius={[0, 4, 4, 0]} barSize={20}>
                  {stats.topServicos.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#b5936a' : '#d4b896'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Quick Actions / Info */}
      <div className="bg-[#1e0f07] p-8 rounded-3xl text-white flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative">
        <div className="relative z-10">
          <h2 className="text-2xl font-bold mb-2">Pronta para o dia de hoje?</h2>
          <p className="text-[#a08060] max-w-md">
            Você tem {stats.resumo.agendamentosHoje} agendamentos marcados para hoje. Confira a agenda completa para não perder nenhum detalhe.
          </p>
          <button 
            onClick={() => onNavigate('agendamentos')}
            className="mt-6 bg-[#b5936a] text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-[#c5a37a] transition-colors"
          >
            Ver Agenda <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="hidden md:block absolute right-[-20px] bottom-[-40px] opacity-10">
          <Calendar className="w-64 h-64" />
        </div>
      </div>
    </div>
  );
}

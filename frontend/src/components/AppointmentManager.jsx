import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Calendar as CalendarIcon, 
  MoreHorizontal, 
  Check, 
  X, 
  Trash2, 
  Phone, 
  Mail,
  RefreshCcw,
  AlertCircle
} from 'lucide-react';
import { listarAgendamentosAdmin, atualizarAgendamentoAdmin, cancelarAgendamentoAdmin } from '../services/admin';
import { clsx } from 'clsx';

const STATUS_CONFIG = {
  pendente: { label: 'Pendente', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  confirmado: { label: 'Confirmado', color: 'bg-green-100 text-green-700 border-green-200' },
  cancelado: { label: 'Cancelado', color: 'bg-red-100 text-red-700 border-red-200' },
  concluído: { label: 'Concluído', color: 'bg-purple-100 text-purple-700 border-purple-200' },
};

export default function AppointmentManager() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    dataInicio: '',
    dataFim: '',
    search: ''
  });
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});

  async function loadAppointments() {
    setLoading(true);
    try {
      const { status, dataInicio, dataFim } = filters;
      const data = await listarAgendamentosAdmin({ 
        status, 
        dataInicio, 
        dataFim, 
        page, 
        limit: 10 
      });
      setAppointments(data.agendamentos);
      setPagination(data.paginacao);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAppointments();
  }, [filters.status, filters.dataInicio, filters.dataFim, page]);

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await atualizarAgendamentoAdmin(id, { status: newStatus });
      loadAppointments();
    } catch (err) {
      alert('Erro ao atualizar status: ' + err.message);
    }
  };

  const handleCancel = async (id) => {
    if (!confirm('Deseja realmente cancelar este agendamento?')) return;
    try {
      await cancelarAgendamentoAdmin(id);
      loadAppointments();
    } catch (err) {
      alert('Erro ao cancelar: ' + err.message);
    }
  };

  const filteredAppointments = useMemo(() => {
    if (!filters.search) return appointments;
    const s = filters.search.toLowerCase();
    return appointments.filter(a => 
      a.nomeCliente.toLowerCase().includes(s) || 
      a.telefone.includes(s) || 
      a.servico?.nome.toLowerCase().includes(s)
    );
  }, [appointments, filters.search]);

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Buscar por cliente, telefone ou serviço..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-[#b5936a] text-sm"
            value={filters.search}
            onChange={e => setFilters({...filters, search: e.target.value})}
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          <select 
            className="bg-gray-50 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-[#b5936a]"
            value={filters.status}
            onChange={e => setFilters({...filters, status: e.target.value})}
          >
            <option value="">Todos os Status</option>
            <option value="pendente">Pendentes</option>
            <option value="confirmado">Confirmados</option>
            <option value="concluído">Concluídos</option>
            <option value="cancelado">Cancelados</option>
          </select>

          <input 
            type="date" 
            className="bg-gray-50 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-[#b5936a]"
            value={filters.dataInicio}
            onChange={e => setFilters({...filters, dataInicio: e.target.value})}
          />

          <button 
            onClick={loadAppointments}
            className="p-2 bg-gray-50 text-gray-500 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <RefreshCcw className={clsx("w-5 h-5", loading && "animate-spin")} />
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Cliente</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Serviço</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Data/Hora</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-400">Carregando agendamentos...</td>
                </tr>
              ) : filteredAppointments.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-400">Nenhum agendamento encontrado.</td>
                </tr>
              ) : (
                filteredAppointments.map((appointment) => (
                  <tr key={appointment.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-900">{appointment.nomeCliente}</span>
                        <div className="flex gap-3 mt-1">
                          <a 
                            href={`https://wa.me/55${appointment.telefone.replace(/\D/g, '')}`} 
                            target="_blank" 
                            rel="noreferrer"
                            className="text-xs text-green-600 flex items-center gap-1 hover:underline"
                          >
                            <Phone className="w-3 h-3" /> {appointment.telefone}
                          </a>
                          {appointment.email && (
                            <span className="text-xs text-gray-400 flex items-center gap-1">
                              <Mail className="w-3 h-3" /> {appointment.email}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-700">{appointment.servico?.nome}</span>
                        <span className="text-xs text-gray-400">R$ {Number(appointment.servico?.preco || 0).toFixed(2).replace('.', ',')}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-700">
                          {new Date(appointment.data).toLocaleDateString('pt-BR')}
                        </span>
                        <span className="text-xs text-[#b5936a] font-bold">{appointment.hora}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={clsx(
                        "px-3 py-1 rounded-full text-xs font-bold border",
                        STATUS_CONFIG[appointment.status]?.color || "bg-gray-100 text-gray-600 border-gray-200"
                      )}>
                        {STATUS_CONFIG[appointment.status]?.label || appointment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {appointment.status === 'pendente' && (
                          <button 
                            onClick={() => handleStatusUpdate(appointment.id, 'confirmado')}
                            className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100"
                            title="Confirmar"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        {appointment.status === 'confirmado' && (
                          <button 
                            onClick={() => handleStatusUpdate(appointment.id, 'concluído')}
                            className="p-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100"
                            title="Marcar como Concluído"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        )}
                        {appointment.status !== 'cancelado' && (
                          <button 
                            onClick={() => handleCancel(appointment.id)}
                            className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
                            title="Cancelar"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPaginas > 1 && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
            <span className="text-sm text-gray-500">
              Página {pagination.pagina} de {pagination.totalPaginas}
            </span>
            <div className="flex gap-2">
              <button 
                disabled={pagination.pagina === 1}
                onClick={() => setPage(p => p - 1)}
                className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm disabled:opacity-50"
              >
                Anterior
              </button>
              <button 
                disabled={pagination.pagina === pagination.totalPaginas}
                onClick={() => setPage(p => p + 1)}
                className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm disabled:opacity-50"
              >
                Próxima
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CheckCircle2(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

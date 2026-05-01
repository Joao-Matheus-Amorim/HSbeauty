import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Plus, 
  Trash2, 
  AlertCircle, 
  X,
  Info,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { 
  listarHorariosAdmin, 
  criarHorarioAdmin, 
  desativarHorarioAdmin 
} from '../services/admin';
import { clsx } from 'clsx';

export default function ScheduleManager() {
  const [horarios, setHorarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    dataInicio: '',
    dataFim: '',
    horaInicio: '',
    horaFim: '',
    motivo: ''
  });

  async function loadHorarios() {
    setLoading(true);
    try {
      const data = await listarHorariosAdmin({ ativo: 'true' });
      setHorarios(data.horarios);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadHorarios();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Formatar as datas para o formato ISO esperado pelo backend
      const payload = {
        dataInicio: new Date(formData.dataInicio + (formData.horaInicio ? `T${formData.horaInicio}` : 'T00:00:00')).toISOString(),
        dataFim: new Date(formData.dataFim + (formData.horaFim ? `T${formData.horaFim}` : 'T23:59:59')).toISOString(),
        horaInicio: formData.horaInicio || null,
        horaFim: formData.horaFim || null,
        motivo: formData.motivo || null
      };

      await criarHorarioAdmin(payload);
      setIsModalOpen(false);
      setFormData({ dataInicio: '', dataFim: '', horaInicio: '', horaFim: '', motivo: '' });
      loadHorarios();
    } catch (err) {
      alert('Erro ao criar bloqueio: ' + err.message);
    }
  };

  const handleRemove = async (id) => {
    if (!confirm('Deseja remover este bloqueio de horário?')) return;
    try {
      await desativarHorarioAdmin(id);
      loadHorarios();
    } catch (err) {
      alert('Erro ao remover: ' + err.message);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Gestão de Horários</h2>
          <p className="text-sm text-gray-500">Bloqueie datas ou períodos específicos para impedir novos agendamentos.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-[#1e0f07] text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-[#2c1810] transition-colors shadow-lg"
        >
          <Plus className="w-5 h-5" /> Bloquear Horário
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Info Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-[#b5936a] text-white p-6 rounded-3xl shadow-sm">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Info className="w-5 h-5" /> Dica de Uso
            </h3>
            <ul className="space-y-3 text-sm text-white/90">
              <li className="flex gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-white mt-1.5 shrink-0" />
                <span>Para bloquear um **dia inteiro**, deixe os campos de hora em branco.</span>
              </li>
              <li className="flex gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-white mt-1.5 shrink-0" />
                <span>Bloqueios são úteis para feriados, folgas ou manutenção do salão.</span>
              </li>
              <li className="flex gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-white mt-1.5 shrink-0" />
                <span>Agendamentos já existentes **não** são cancelados automaticamente.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* List Card */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-50 flex justify-between items-center">
              <h3 className="font-bold text-gray-800">Bloqueios Ativos</h3>
              <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-bold">
                {horarios.length} Total
              </span>
            </div>
            
            <div className="divide-y divide-gray-50">
              {loading ? (
                <div className="p-12 text-center text-gray-400">Carregando bloqueios...</div>
              ) : horarios.length === 0 ? (
                <div className="p-12 text-center text-gray-400 flex flex-col items-center gap-2">
                  <CalendarIcon className="w-8 h-8 opacity-20" />
                  <span>Nenhum bloqueio ativo no momento.</span>
                </div>
              ) : (
                horarios.map((h) => (
                  <div key={h.id} className="p-6 flex items-center justify-between hover:bg-gray-50/50 transition-colors group">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
                        <Clock className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900">
                            {new Date(h.dataInicio).toLocaleDateString('pt-BR')}
                          </span>
                          {h.dataInicio !== h.dataFim && (
                            <>
                              <ChevronRight className="w-3 h-3 text-gray-300" />
                              <span className="font-bold text-gray-900">
                                {new Date(h.dataFim).toLocaleDateString('pt-BR')}
                              </span>
                            </>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mt-0.5">
                          {h.horaInicio ? `${h.horaInicio} às ${h.horaFim}` : 'Dia Inteiro'}
                        </p>
                        {h.motivo && (
                          <span className="inline-block mt-2 text-xs font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                            {h.motivo}
                          </span>
                        )}
                      </div>
                    </div>
                    <button 
                      onClick={() => handleRemove(h.id)}
                      className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#b5936a]" /> Bloquear Horário
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Data Início</label>
                  <input 
                    required
                    type="date" 
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[#b5936a]"
                    value={formData.dataInicio}
                    onChange={e => setFormData({...formData, dataInicio: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Data Fim</label>
                  <input 
                    required
                    type="date" 
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[#b5936a]"
                    value={formData.dataFim}
                    onChange={e => setFormData({...formData, dataFim: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Hora Início (opcional)</label>
                  <input 
                    type="time" 
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[#b5936a]"
                    value={formData.horaInicio}
                    onChange={e => setFormData({...formData, horaInicio: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Hora Fim (opcional)</label>
                  <input 
                    type="time" 
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[#b5936a]"
                    value={formData.horaFim}
                    onChange={e => setFormData({...formData, horaFim: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Motivo / Descrição</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[#b5936a]"
                  placeholder="Ex: Feriado Nacional, Folga, Reforma..."
                  value={formData.motivo}
                  onChange={e => setFormData({...formData, motivo: e.target.value})}
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-6 py-3 bg-gray-100 text-gray-600 rounded-2xl font-bold hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-6 py-3 bg-[#1e0f07] text-white rounded-2xl font-bold hover:bg-[#2c1810] transition-colors shadow-lg"
                >
                  Confirmar Bloqueio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

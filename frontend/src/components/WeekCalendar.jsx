import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { listarAgendamentosAdmin } from '../services/admin';
import { STATUS } from '../constants';
import { clsx } from 'clsx';

const SLOT_HOURS = [];
for (let h = 9; h < 18; h++) {
  SLOT_HOURS.push(`${String(h).padStart(2, '0')}:00`);
  if (h < 17 || h === 17) SLOT_HOURS.push(`${String(h).padStart(2, '0')}:30`);
}

const STATUS_CHIP = {
  [STATUS.PENDENTE]: 'bg-amber-100 text-amber-800 border-amber-200',
  [STATUS.CONFIRMADO]: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  [STATUS.CANCELADO]: 'bg-red-50 text-red-400 border-red-200 line-through',
  [STATUS.CONCLUIDO]: 'bg-indigo-100 text-indigo-700 border-indigo-200',
};

function getWeekStart(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
  return d;
}

function dateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function isToday(date) {
  return dateKey(date) === dateKey(new Date());
}

export default function WeekCalendar() {
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });

  const dataInicio = `${dateKey(weekDays[0])}T00:00:00.000`;
  const dataFim = `${dateKey(weekDays[6])}T23:59:59.999`;

  const load = useCallback(async (shouldIgnore = () => false) => {
    setLoading(true);
    try {
      const data = await listarAgendamentosAdmin({ dataInicio, dataFim, limit: 100, page: 1 });
      if (!shouldIgnore()) setAppointments(data.agendamentos || []);
    } catch {
      if (!shouldIgnore()) setAppointments([]);
    } finally {
      if (!shouldIgnore()) setLoading(false);
    }
  }, [dataInicio, dataFim]);

  useEffect(() => {
    let cancelled = false;
    const id = window.setTimeout(() => { load(() => cancelled); }, 0);
    return () => { cancelled = true; window.clearTimeout(id); };
  }, [load]);

  const aptMap = {};
  appointments.forEach((apt) => {
    const k = `${dateKey(new Date(apt.data))}|${apt.hora || '--:--'}`;
    if (!aptMap[k]) aptMap[k] = [];
    aptMap[k].push(apt);
  });

  const shiftWeek = (n) =>
    setWeekStart((w) => {
      const d = new Date(w);
      d.setDate(d.getDate() + n * 7);
      return d;
    });

  const weekLabel = `${weekDays[0].toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} – ${weekDays[6].toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}`;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <button type="button" onClick={() => shiftWeek(-1)} className="admin-refresh-btn" aria-label="Semana anterior">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="font-semibold text-sm text-gray-700 min-w-[220px] text-center">{weekLabel}</span>
        <button type="button" onClick={() => shiftWeek(1)} className="admin-refresh-btn" aria-label="Próxima semana">
          <ChevronRight className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={() => setWeekStart(getWeekStart(new Date()))}
          className="admin-refresh-btn text-xs px-3"
        >
          Hoje
        </button>
        {loading && <span className="text-xs text-gray-400 animate-pulse ml-1">Carregando...</span>}
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <div style={{ minWidth: '680px' }}>
          <div className="grid" style={{ gridTemplateColumns: '56px repeat(7, 1fr)' }}>
            <div className="h-10 bg-gray-50 border-b border-r border-gray-200" />
            {weekDays.map((day) => (
              <div
                key={day.toISOString()}
                className={clsx(
                  'h-10 flex flex-col items-center justify-center border-b border-r border-gray-200 text-[11px] font-semibold',
                  isToday(day) ? 'bg-rose-50 text-rose-600' : 'bg-gray-50 text-gray-500',
                )}
              >
                <span>{day.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')}</span>
                <span>{day.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</span>
              </div>
            ))}
          </div>

          {SLOT_HOURS.map((slot) => (
            <div key={slot} className="grid" style={{ gridTemplateColumns: '56px repeat(7, 1fr)' }}>
              <div className="border-b border-r border-gray-100 bg-gray-50 flex items-center justify-center text-[10px] text-gray-400 font-medium h-11">
                {slot}
              </div>
              {weekDays.map((day) => {
                const k = `${dateKey(day)}|${slot}`;
                const apts = aptMap[k] || [];
                return (
                  <div
                    key={day.toISOString()}
                    className={clsx(
                      'border-b border-r border-gray-100 h-11 p-0.5 space-y-0.5 overflow-hidden',
                      isToday(day) && 'bg-rose-50/20',
                    )}
                  >
                    {apts.map((apt) => (
                      <div
                        key={apt.id}
                        title={`${apt.nomeCliente} — ${apt.servico?.nome || 'Serviço'} (${apt.status})`}
                        className={clsx(
                          'text-[10px] leading-tight px-1 py-px rounded border truncate cursor-default select-none',
                          STATUS_CHIP[apt.status] ?? STATUS_CHIP[STATUS.PENDENTE],
                        )}
                      >
                        {apt.nomeCliente}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Search,
  Check,
  X,
  Phone,
  Mail,
  RefreshCcw,
  AlertCircle,
  CheckCircle2,
  CalendarDays,
  Clock3,
  Scissors,
  UserRound,
  MessageCircle,
  Download,
  LayoutList,
  CalendarRange,
} from 'lucide-react';
import { listarAgendamentosAdmin, atualizarAgendamentoAdmin, cancelarAgendamentoAdmin, exportarAgendamentosCSV } from '../services/admin';
import { STATUS } from '../constants';
import { clsx } from 'clsx';
import WeekCalendar from './WeekCalendar';

const STATUS_CONFIG = {
  [STATUS.PENDENTE]: {
    label: 'Pendente',
    badge: 'admin-status-badge is-pending',
    card: 'is-pending',
  },
  [STATUS.CONFIRMADO]: {
    label: 'Confirmado',
    badge: 'admin-status-badge is-confirmed',
    card: 'is-confirmed',
  },
  [STATUS.CANCELADO]: {
    label: 'Cancelado',
    badge: 'admin-status-badge is-canceled',
    card: 'is-canceled',
  },
  [STATUS.CONCLUIDO]: {
    label: 'Concluído',
    badge: 'admin-status-badge is-done',
    card: 'is-done',
  },
};

const FILTER_TABS = [
  { value: STATUS.PENDENTE, label: 'Confirmar', helper: 'Novos pedidos' },
  { value: STATUS.CONFIRMADO, label: 'Confirmados', helper: 'Já aprovados' },
  { value: '', label: 'Todos', helper: 'Agenda geral' },
  { value: STATUS.CANCELADO, label: 'Cancelados', helper: 'Histórico' },
];

function cleanPhone(phone = '') {
  return String(phone).replace(/\D/g, '');
}

function formatPhone(phone = '') {
  const digits = cleanPhone(phone);
  if (!digits) return 'Sem telefone';
  if (digits.length === 11) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  if (digits.length === 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return phone;
}

function formatPrice(value) {
  return Number(value || 0).toFixed(2).replace('.', ',');
}

function formatDate(value) {
  if (!value) return '--/--';
  return new Date(value)
    .toLocaleDateString('pt-BR', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
    })
    .replace('.', '');
}

function formatFullDate(value) {
  if (!value) return '--/--/----';
  return new Date(value).toLocaleDateString('pt-BR');
}

function AppointmentCard({ appointment, onConfirm, onComplete, onCancel }) {
  const status = STATUS_CONFIG[appointment.status] || STATUS_CONFIG[STATUS.PENDENTE];
  const phone = cleanPhone(appointment.telefone);
  const whatsappHref = phone ? `https://wa.me/55${phone}` : null;
  const telHref = phone ? `tel:+55${phone}` : null;
  const serviceName = appointment.servico?.nome || 'Serviço';
  const servicePrice = formatPrice(appointment.servico?.preco);

  const primaryAction =
    appointment.status === STATUS.PENDENTE
      ? { label: 'Confirmar', icon: Check, className: 'confirm', onClick: () => onConfirm(appointment.id) }
      : appointment.status === STATUS.CONFIRMADO
        ? { label: 'Concluir', icon: CheckCircle2, className: 'done', onClick: () => onComplete(appointment.id) }
        : null;
  const PrimaryIcon = primaryAction?.icon;

  return (
    <article className={clsx('admin-appointment-card admin-mini-appointment-card', status.card)}>
      <div className="admin-appointment-card-glow" />

      <header className="admin-appointment-card-header admin-mini-card-header">
        <div className="admin-client-avatar">
          <UserRound className="w-5 h-5" />
        </div>
        <div className="admin-client-main">
          <span className="admin-card-overline">Cliente</span>
          <h3>{appointment.nomeCliente || 'Cliente sem nome'}</h3>
          <p className="admin-mini-phone">{formatPhone(appointment.telefone)}</p>
        </div>
        <span className={status.badge}>{status.label}</span>
      </header>

      <div className="admin-mini-summary-row" aria-label="Resumo do agendamento">
        <span className="admin-mini-chip is-service">
          <Scissors className="w-3.5 h-3.5" />
          {serviceName}
        </span>
        <span className="admin-mini-chip">
          <CalendarDays className="w-3.5 h-3.5" />
          {formatDate(appointment.data)}
        </span>
        <span className="admin-mini-chip is-time">
          <Clock3 className="w-3.5 h-3.5" />
          {appointment.hora || '--:--'}
        </span>
        <span className="admin-mini-chip is-price">R$ {servicePrice}</span>
      </div>

      <div className="admin-mini-meta-row">
        <span>{formatFullDate(appointment.data)}</span>
        {appointment.email && <span>{appointment.email}</span>}
      </div>

      <div className="admin-mini-actions">
        {whatsappHref ? (
          <a href={whatsappHref} target="_blank" rel="noreferrer" className="admin-mini-action whatsapp">
            <MessageCircle className="w-4 h-4" />
            Whats
          </a>
        ) : (
          <span className="admin-mini-action disabled">
            <Phone className="w-4 h-4" />
            Sem tel
          </span>
        )}

        {telHref && (
          <a href={telHref} className="admin-mini-action call">
            <Phone className="w-4 h-4" />
            Ligar
          </a>
        )}

        {appointment.email && (
          <a href={`mailto:${appointment.email}`} className="admin-mini-action email" aria-label="Enviar email">
            <Mail className="w-4 h-4" />
            Email
          </a>
        )}

        {primaryAction && (
          <button
            type="button"
            onClick={primaryAction.onClick}
            className={clsx('admin-mini-action admin-mini-primary', primaryAction.className)}
          >
            <PrimaryIcon className="w-4 h-4" />
            {primaryAction.label}
          </button>
        )}

        {appointment.status !== STATUS.CANCELADO && (
          <button type="button" onClick={() => onCancel(appointment.id)} className="admin-mini-action cancel">
            <X className="w-4 h-4" />
            Cancelar
          </button>
        )}
      </div>
    </article>
  );
}

export default function AppointmentManager() {
  const [view, setView] = useState('list');
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [confirmCancelId, setConfirmCancelId] = useState(null);
  const [exporting, setExporting] = useState(false);

  const [filters, setFilters] = useState({
    status: STATUS.PENDENTE,
    dataInicio: '',
    dataFim: '',
    search: '',
  });
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});

  const { status, dataInicio, dataFim, search } = filters;
  const effectiveDataFim = dataFim || dataInicio;
  const dataInicioFilter = dataInicio ? `${dataInicio}T00:00:00.000` : '';
  const dataFimFilter = effectiveDataFim ? `${effectiveDataFim}T23:59:59.999` : '';

  const loadAppointments = useCallback(
    async ({ silent = false, shouldIgnore = () => false } = {}) => {
      if (!silent && !shouldIgnore()) setLoading(true);
      if (!shouldIgnore()) setError(null);

      try {
        const data = await listarAgendamentosAdmin({
          status,
          dataInicio: dataInicioFilter,
          dataFim: dataFimFilter,
          search,
          page,
          limit: 10,
        });

        if (shouldIgnore()) return;

        setError(null);
        setAppointments(data.agendamentos || []);
        setPagination(data.paginacao || {});
      } catch (err) {
        if (shouldIgnore()) return;

        setError(err.message);
        setAppointments([]);
        setPagination({});
      } finally {
        if (!shouldIgnore()) setLoading(false);
      }
    },
    [status, dataInicioFilter, dataFimFilter, search, page],
  );

  useEffect(() => {
    let ignore = false;

    const timerId = window.setTimeout(() => {
      loadAppointments({ shouldIgnore: () => ignore });
    }, 0);

    return () => {
      ignore = true;
      window.clearTimeout(timerId);
    };
  }, [loadAppointments]);

  const handleStatusUpdate = async (id, newStatus) => {
    setActionError(null);
    try {
      await atualizarAgendamentoAdmin(id, { status: newStatus });
      await loadAppointments({ silent: true });
    } catch (err) {
      setActionError('Erro ao atualizar status: ' + err.message);
    }
  };

  const handleCancelRequest = (id) => {
    setConfirmCancelId(id);
    setActionError(null);
  };

  const handleCancelConfirm = async () => {
    const id = confirmCancelId;
    setConfirmCancelId(null);
    try {
      await cancelarAgendamentoAdmin(id);
      await loadAppointments({ silent: true });
    } catch (err) {
      setActionError('Erro ao cancelar: ' + err.message);
    }
  };

  const filteredAppointments = useMemo(() => appointments, [appointments]);

  const title = status === STATUS.PENDENTE ? 'Para confirmar' : 'Agendamentos';
  const emptyMessage = status === STATUS.PENDENTE
    ? 'Nenhum agendamento pendente para confirmar.'
    : 'Nenhum agendamento encontrado.';

  function changeStatusFilter(newStatus) {
    setLoading(true);
    setError(null);
    setPage(1);
    setFilters((current) => ({ ...current, status: newStatus }));
  }

  function changeSearch(value) {
    setPage(1);
    setFilters((current) => ({ ...current, search: value }));
  }

  function changeDate(value) {
    setLoading(true);
    setError(null);
    setPage(1);
    setFilters((current) => ({ ...current, dataInicio: value, dataFim: value }));
  }

  function changePage(updater) {
    setLoading(true);
    setError(null);
    setPage(updater);
  }

  async function handleExport() {
    setExporting(true);
    try {
      const blob = await exportarAgendamentosCSV({
        status,
        dataInicio: dataInicioFilter,
        dataFim: dataFimFilter,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `agendamentos-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setActionError('Erro ao exportar: ' + err.message);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-6 admin-appointments-screen">
      <div className="admin-section-hero">
        <div>
          <span className="admin-section-kicker">Agenda</span>
          <h2>{title}</h2>
          <p>
            {status === STATUS.PENDENTE
              ? 'Confirme ou cancele os pedidos que chegaram pelo site.'
              : 'Veja e gerencie todos os agendamentos.'}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setView((v) => (v === 'list' ? 'calendar' : 'list'))}
            className={clsx('admin-refresh-btn', view === 'calendar' && 'ring-2 ring-rose-400')}
            aria-label={view === 'list' ? 'Ver calendário semanal' : 'Ver lista'}
            title={view === 'list' ? 'Calendário' : 'Lista'}
          >
            {view === 'list' ? <CalendarRange className="w-5 h-5" /> : <LayoutList className="w-5 h-5" />}
          </button>
          <button type="button" onClick={handleExport} disabled={exporting} className="admin-refresh-btn" aria-label="Exportar CSV">
            <Download className={clsx('w-5 h-5', exporting && 'opacity-50')} />
          </button>
          <button type="button" onClick={() => loadAppointments()} className="admin-refresh-btn" aria-label="Atualizar agenda">
            <RefreshCcw className={clsx('w-5 h-5', loading && 'animate-spin')} />
          </button>
        </div>
      </div>

      {view === 'calendar' && <WeekCalendar />}

      {view === 'list' && <>
      <div className="admin-status-tabs" aria-label="Filtros rápidos de agendamento">
        {FILTER_TABS.map((tab) => (
          <button
            type="button"
            key={tab.value || 'todos'}
            className={clsx('admin-status-tab', status === tab.value && 'is-active')}
            onClick={() => changeStatusFilter(tab.value)}
          >
            <strong>{tab.label}</strong>
            <span>{tab.helper}</span>
          </button>
        ))}
      </div>

      <div className="admin-filter-card">
        <div className="admin-search-field">
          <Search className="w-4 h-4" />
          <input
            type="text"
            placeholder="Buscar cliente, telefone ou serviço..."
            value={search}
            onChange={(e) => changeSearch(e.target.value)}
          />
        </div>

        <div className="admin-date-field">
          <CalendarDays className="w-4 h-4" />
          <input
            type="date"
            value={dataInicio}
            onChange={(e) => changeDate(e.target.value)}
          />
        </div>
      </div>

      {actionError && (
        <div className="admin-error-card" role="alert">
          <AlertCircle className="w-5 h-5" />
          <span>{actionError}</span>
          <button type="button" onClick={() => setActionError(null)} className="ml-auto text-sm underline">Fechar</button>
        </div>
      )}

      {confirmCancelId && (
        <div className="admin-error-card" role="alertdialog" aria-label="Confirmar cancelamento">
          <AlertCircle className="w-5 h-5" />
          <span>Deseja realmente cancelar este agendamento?</span>
          <div className="flex gap-2 ml-auto">
            <button type="button" onClick={handleCancelConfirm} className="text-sm font-bold text-red-700 underline">
              Sim, cancelar
            </button>
            <button type="button" onClick={() => setConfirmCancelId(null)} className="text-sm underline">
              Não
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="admin-error-card">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      <section className="admin-appointments-list" aria-label="Lista de agendamentos">
        {loading && <div className="admin-loading-card">Carregando agendamentos...</div>}

        {!loading && filteredAppointments.length === 0 && <div className="admin-empty-card">{emptyMessage}</div>}

        {!loading && filteredAppointments.map((appointment) => (
          <AppointmentCard
            key={appointment.id}
            appointment={appointment}
            onConfirm={(id) => handleStatusUpdate(id, STATUS.CONFIRMADO)}
            onComplete={(id) => handleStatusUpdate(id, STATUS.CONCLUIDO)}
            onCancel={handleCancelRequest}
          />
        ))}
      </section>

      {pagination.totalPaginas > 1 && (
        <div className="admin-pagination">
          <span>Página {pagination.pagina} de {pagination.totalPaginas}</span>
          <div>
            <button
              type="button"
              disabled={pagination.pagina === 1}
              onClick={() => changePage((p) => p - 1)}
            >
              Anterior
            </button>
            <button
              type="button"
              disabled={pagination.pagina === pagination.totalPaginas}
              onClick={() => changePage((p) => p + 1)}
            >
              Próxima
            </button>
          </div>
        </div>
      )}
      </>}
    </div>
  );
}

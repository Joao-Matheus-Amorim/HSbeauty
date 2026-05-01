import React, { useState, useEffect, useMemo } from 'react';
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
} from 'lucide-react';
import { listarAgendamentosAdmin, atualizarAgendamentoAdmin, cancelarAgendamentoAdmin } from '../services/admin';
import { clsx } from 'clsx';

const STATUS_CONFIG = {
  pendente: {
    label: 'Precisa confirmar',
    badge: 'admin-status-badge is-pending',
    card: 'is-pending',
  },
  confirmado: {
    label: 'Confirmado',
    badge: 'admin-status-badge is-confirmed',
    card: 'is-confirmed',
  },
  cancelado: {
    label: 'Cancelado',
    badge: 'admin-status-badge is-canceled',
    card: 'is-canceled',
  },
  concluído: {
    label: 'Concluído',
    badge: 'admin-status-badge is-done',
    card: 'is-done',
  },
};

const FILTER_TABS = [
  { value: 'pendente', label: 'Confirmar', helper: 'Novos pedidos' },
  { value: 'confirmado', label: 'Confirmados', helper: 'Já aprovados' },
  { value: '', label: 'Todos', helper: 'Agenda geral' },
  { value: 'cancelado', label: 'Cancelados', helper: 'Histórico' },
];

function cleanPhone(phone = '') {
  return String(phone).replace(/\D/g, '');
}

function formatPrice(value) {
  return Number(value || 0).toFixed(2).replace('.', ',');
}

function formatDate(value) {
  if (!value) return '--/--';
  return new Date(value).toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
  }).replace('.', '');
}

function formatFullDate(value) {
  if (!value) return '--/--/----';
  return new Date(value).toLocaleDateString('pt-BR');
}

function AppointmentCard({ appointment, onConfirm, onComplete, onCancel }) {
  const status = STATUS_CONFIG[appointment.status] || STATUS_CONFIG.pendente;
  const phone = cleanPhone(appointment.telefone);
  const whatsappHref = phone ? `https://wa.me/55${phone}` : null;
  const serviceName = appointment.servico?.nome || 'Serviço';
  const servicePrice = formatPrice(appointment.servico?.preco);

  return (
    <article className={clsx('admin-appointment-card', status.card)}>
      <div className="admin-appointment-card-glow" />

      <header className="admin-appointment-card-header">
        <div className="admin-client-avatar">
          <UserRound className="w-5 h-5" />
        </div>
        <div className="admin-client-main">
          <span className="admin-card-overline">Cliente</span>
          <h3>{appointment.nomeCliente || 'Cliente sem nome'}</h3>
        </div>
        <span className={status.badge}>{status.label}</span>
      </header>

      <div className="admin-appointment-info-grid">
        <div className="admin-info-pill is-service">
          <Scissors className="w-4 h-4" />
          <div>
            <span>Serviço</span>
            <strong>{serviceName}</strong>
          </div>
        </div>

        <div className="admin-info-pill">
          <CalendarDays className="w-4 h-4" />
          <div>
            <span>Dia</span>
            <strong>{formatDate(appointment.data)}</strong>
          </div>
        </div>

        <div className="admin-info-pill">
          <Clock3 className="w-4 h-4" />
          <div>
            <span>Hora</span>
            <strong>{appointment.hora || '--:--'}</strong>
          </div>
        </div>
      </div>

      <div className="admin-card-details">
        <div>
          <span>Valor</span>
          <strong>R$ {servicePrice}</strong>
        </div>
        <div>
          <span>Data completa</span>
          <strong>{formatFullDate(appointment.data)}</strong>
        </div>
      </div>

      <div className="admin-contact-actions">
        {whatsappHref ? (
          <a href={whatsappHref} target="_blank" rel="noreferrer" className="admin-contact-btn whatsapp">
            <MessageCircle className="w-4 h-4" />
            WhatsApp
          </a>
        ) : (
          <span className="admin-contact-btn disabled">
            <Phone className="w-4 h-4" />
            Sem telefone
          </span>
        )}
        {appointment.email && (
          <a href={`mailto:${appointment.email}`} className="admin-contact-btn email">
            <Mail className="w-4 h-4" />
            Email
          </a>
        )}
      </div>

      <footer className="admin-card-actions">
        {appointment.status === 'pendente' && (
          <button type="button" onClick={() => onConfirm(appointment.id)} className="admin-card-btn confirm">
            <Check className="w-4 h-4" />
            Confirmar
          </button>
        )}

        {appointment.status === 'confirmado' && (
          <button type="button" onClick={() => onComplete(appointment.id)} className="admin-card-btn done">
            <CheckCircle2 className="w-4 h-4" />
            Concluir
          </button>
        )}

        {appointment.status !== 'cancelado' && (
          <button type="button" onClick={() => onCancel(appointment.id)} className="admin-card-btn cancel">
            <X className="w-4 h-4" />
            Cancelar
          </button>
        )}
      </footer>
    </article>
  );
}

export default function AppointmentManager() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: 'pendente',
    dataInicio: '',
    dataFim: '',
    search: '',
  });
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});

  async function loadAppointments() {
    setLoading(true);
    setError(null);
    try {
      const { status, dataInicio, dataFim } = filters;
      const data = await listarAgendamentosAdmin({
        status,
        dataInicio,
        dataFim,
        page,
        limit: 10,
      });
      setAppointments(data.agendamentos || []);
      setPagination(data.paginacao || {});
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
    return appointments.filter((a) => {
      const nameMatch = a.nomeCliente?.toLowerCase().includes(s);
      const phoneMatch = a.telefone?.includes(s);
      const serviceMatch = a.servico?.nome?.toLowerCase().includes(s);
      return nameMatch || phoneMatch || serviceMatch;
    });
  }, [appointments, filters.search]);

  const title = filters.status === 'pendente' ? 'Para confirmar' : 'Agendamentos';
  const emptyMessage = filters.status === 'pendente'
    ? 'Nenhum agendamento pendente para confirmar.'
    : 'Nenhum agendamento encontrado.';

  function changeStatusFilter(status) {
    setPage(1);
    setFilters((current) => ({ ...current, status }));
  }

  function changeSearch(value) {
    setFilters((current) => ({ ...current, search: value }));
  }

  function changeDate(value) {
    setPage(1);
    setFilters((current) => ({ ...current, dataInicio: value }));
  }

  return (
    <div className="space-y-6 admin-appointments-screen">
      <div className="admin-section-hero">
        <div>
          <span className="admin-section-kicker">Agenda</span>
          <h2>{title}</h2>
          <p>
            {filters.status === 'pendente'
              ? 'Confirme ou cancele os pedidos que chegaram pelo site.'
              : 'Veja e gerencie todos os agendamentos.'}
          </p>
        </div>
        <button type="button" onClick={loadAppointments} className="admin-refresh-btn" aria-label="Atualizar agenda">
          <RefreshCcw className={clsx('w-5 h-5', loading && 'animate-spin')} />
        </button>
      </div>

      <div className="admin-status-tabs" aria-label="Filtros rápidos de agendamento">
        {FILTER_TABS.map((tab) => (
          <button
            type="button"
            key={tab.value || 'todos'}
            className={clsx('admin-status-tab', filters.status === tab.value && 'is-active')}
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
            value={filters.search}
            onChange={(e) => changeSearch(e.target.value)}
          />
        </div>

        <div className="admin-date-field">
          <CalendarDays className="w-4 h-4" />
          <input
            type="date"
            value={filters.dataInicio}
            onChange={(e) => changeDate(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <div className="admin-error-card">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      <section className="admin-appointments-list" aria-label="Lista de agendamentos">
        {loading && (
          <div className="admin-loading-card">Carregando agendamentos...</div>
        )}

        {!loading && filteredAppointments.length === 0 && (
          <div className="admin-empty-card">{emptyMessage}</div>
        )}

        {!loading && filteredAppointments.map((appointment) => (
          <AppointmentCard
            key={appointment.id}
            appointment={appointment}
            onConfirm={(id) => handleStatusUpdate(id, 'confirmado')}
            onComplete={(id) => handleStatusUpdate(id, 'concluído')}
            onCancel={handleCancel}
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
              onClick={() => setPage((p) => p - 1)}
            >
              Anterior
            </button>
            <button
              type="button"
              disabled={pagination.pagina === pagination.totalPaginas}
              onClick={() => setPage((p) => p + 1)}
            >
              Próxima
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

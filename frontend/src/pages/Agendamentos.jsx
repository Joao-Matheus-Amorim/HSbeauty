import { useEffect, useState } from 'react';
import {
  listarAgendamentosAdmin,
  atualizarAgendamentoAdmin,
  cancelarAgendamentoAdmin,
} from '../services/admin';
import AgendamentoCard from '../components/agendamentos/AgendamentoCard';
import './Agendamentos.css';

export default function Agendamentos() {
  const [agendamentos, setAgendamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  const carregarAgendamentos = async () => {
    try {
      setLoading(true);
      setErro('');
      const dados = await listarAgendamentosAdmin();
      setAgendamentos(dados.agendamentos || []);
    } catch (error) {
      setErro(error.message || 'Erro ao carregar agendamentos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ativo = true;

    async function buscar() {
      try {
        setLoading(true);
        setErro('');
        const dados = await listarAgendamentosAdmin();
        if (ativo) setAgendamentos(dados.agendamentos || []);
      } catch (error) {
        if (ativo) setErro(error.message || 'Erro ao carregar agendamentos');
      } finally {
        if (ativo) setLoading(false);
      }
    }

    buscar();
    return () => { ativo = false; };
  }, []);

  async function confirmarAgendamento(id) {
    try {
      await atualizarAgendamentoAdmin(id, { status: 'confirmado' });
      await carregarAgendamentos();
    } catch (error) {
      alert(error.message || 'Erro ao confirmar agendamento');
    }
  }

  async function cancelarAgendamento(id) {
    try {
      await atualizarAgendamentoAdmin(id, { status: 'cancelado' });
      await carregarAgendamentos();
    } catch (error) {
      alert(error.message || 'Erro ao cancelar agendamento');
    }
  }

  async function excluirAgendamentoPorId(id) {
    try {
      await cancelarAgendamentoAdmin(id);
      await carregarAgendamentos();
    } catch (error) {
      alert(error.message || 'Erro ao excluir agendamento');
    }
  }

  if (loading) return <p className="agendamentos-status">Carregando agendamentos...</p>;
  if (erro) return <p className="agendamentos-status erro">{erro}</p>;

  return (
    <div className="agendamentos-page">
      <h1 className="agendamentos-title">Agendamentos</h1>
      {agendamentos.length === 0 ? (
        <p className="agendamentos-status">Nenhum agendamento encontrado.</p>
      ) : (
        <div className="agendamentos-lista">
          {agendamentos.map((agendamento) => (
            <AgendamentoCard
              key={agendamento.id}
              agendamento={agendamento}
              onConfirmar={confirmarAgendamento}
              onCancelar={cancelarAgendamento}
              onExcluir={excluirAgendamentoPorId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

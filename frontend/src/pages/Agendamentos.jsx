import { useEffect, useState } from 'react';
import {
  listarAgendamentos,
  atualizarAgendamento,
  excluirAgendamento,
} from '../services/agendamentos';
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
      const dados = await listarAgendamentos();
      setAgendamentos(dados);
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
        const dados = await listarAgendamentos();
        if (ativo) setAgendamentos(dados);
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
      await atualizarAgendamento(id, { status: 'confirmado' });
      await carregarAgendamentos();
    } catch (error) {
      alert(error.message || 'Erro ao confirmar agendamento');
    }
  }

  async function cancelarAgendamento(id) {
    try {
      await atualizarAgendamento(id, { status: 'cancelado' });
      await carregarAgendamentos();
    } catch (error) {
      alert(error.message || 'Erro ao cancelar agendamento');
    }
  }

  async function excluirAgendamentoPorId(id) {
    try {
      await excluirAgendamento(id);
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
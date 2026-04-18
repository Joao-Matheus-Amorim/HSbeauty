import './AgendamentoCard.css';

export default function AgendamentoCard({
  agendamento,
  onConfirmar,
  onCancelar,
  onExcluir,
}) {
  return (
    <div className="agendamento-card">
      <h3 className="agendamento-card__nome">{agendamento.nomeCliente}</h3>

      <p className="agendamento-card__linha">
        <strong>Telefone:</strong> {agendamento.telefone}
      </p>

      <p className="agendamento-card__linha">
        <strong>Serviço:</strong> {agendamento.servico?.nome || 'Sem serviço'}
      </p>

      <p className="agendamento-card__linha">
        <strong>Data:</strong>{' '}
        {new Date(agendamento.data).toLocaleString('pt-BR')}
      </p>

      <p className="agendamento-card__linha">
        <strong>Status:</strong> {agendamento.status}
      </p>

      <div className="agendamento-card__actions">
        <button
          className="agendamento-card__botao agendamento-card__botao--confirmar"
          onClick={() => onConfirmar(agendamento.id)}
        >
          Confirmar
        </button>

        <button
          className="agendamento-card__botao agendamento-card__botao--cancelar"
          onClick={() => onCancelar(agendamento.id)}
        >
          Cancelar
        </button>

        <button
          className="agendamento-card__botao agendamento-card__botao--excluir"
          onClick={() => onExcluir(agendamento.id)}
        >
          Excluir
        </button>
      </div>
    </div>
  );
}
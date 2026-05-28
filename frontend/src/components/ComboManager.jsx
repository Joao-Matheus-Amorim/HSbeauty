import { useEffect, useState } from 'react';
import { listarCombosAdmin, criarComboAdmin, atualizarComboAdmin, desativarComboAdmin } from '../services/admin';
import { listarServicosAdmin } from '../services/admin';

const STATUS_COLORS = {
  true: 'bg-emerald-100 text-emerald-700',
  false: 'bg-gray-100 text-gray-500',
};

function ComboForm({ combo, servicos, onSave, onCancel }) {
  const [nome, setNome] = useState(combo?.nome || '');
  const [descricao, setDescricao] = useState(combo?.descricao || '');
  const [preco, setPreco] = useState(combo ? String(combo.preco) : '');
  const [selecionados, setSelecionados] = useState(
    combo?.itens?.map((i) => i.servico.id) || []
  );
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  function toggleServico(id) {
    setSelecionados((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!nome.trim()) { setErro('Nome obrigatório'); return; }
    if (!preco || isNaN(Number(preco)) || Number(preco) < 0) { setErro('Preço inválido'); return; }
    if (selecionados.length === 0) { setErro('Selecione pelo menos um serviço'); return; }

    setLoading(true);
    setErro('');
    try {
      const dados = { nome: nome.trim(), descricao: descricao.trim() || null, preco: Number(preco), servicoIds: selecionados };
      if (combo) {
        await atualizarComboAdmin(combo.id, dados);
      } else {
        await criarComboAdmin(dados);
      }
      onSave();
    } catch (err) {
      setErro(err.message || 'Erro ao salvar combo');
    } finally {
      setLoading(false);
    }
  }

  const duracaoTotal = selecionados.reduce((sum, id) => {
    const s = servicos.find((sv) => sv.id === id);
    return sum + (s?.duracao || 0);
  }, 0);

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-[#ede8e1] p-6 flex flex-col gap-4 max-w-lg">
      <h3 className="font-bold text-lg text-[#2c1810]">{combo ? 'Editar combo' : 'Novo combo'}</h3>

      <label className="flex flex-col gap-1 text-sm font-medium text-[#5c3d2e]">
        Nome
        <input
          className="border border-[#ddd6ce] rounded-xl px-3 py-2 text-sm outline-none focus:border-[#b5936a]"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Ex: Combo Completo"
          required
        />
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium text-[#5c3d2e]">
        Descrição (opcional)
        <input
          className="border border-[#ddd6ce] rounded-xl px-3 py-2 text-sm outline-none focus:border-[#b5936a]"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          placeholder="Breve descrição do combo"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium text-[#5c3d2e]">
        Preço (R$)
        <input
          className="border border-[#ddd6ce] rounded-xl px-3 py-2 text-sm outline-none focus:border-[#b5936a]"
          type="number"
          min="0"
          step="0.01"
          value={preco}
          onChange={(e) => setPreco(e.target.value)}
          placeholder="0,00"
          required
        />
      </label>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-[#5c3d2e]">
          Serviços incluídos
          {duracaoTotal > 0 && (
            <span className="ml-2 text-xs font-normal text-[#9a7060]">
              Duração total: {Math.floor(duracaoTotal / 60) > 0 ? `${Math.floor(duracaoTotal / 60)}h ` : ''}{duracaoTotal % 60 > 0 ? `${duracaoTotal % 60}min` : ''}
            </span>
          )}
        </span>
        <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
          {servicos.filter((s) => s.ativo).map((s) => (
            <label key={s.id} className="flex items-center gap-3 cursor-pointer rounded-xl border border-[#ede8e1] px-3 py-2 hover:bg-[#fdf8f4] transition-colors">
              <input
                type="checkbox"
                checked={selecionados.includes(s.id)}
                onChange={() => toggleServico(s.id)}
                className="accent-[#b5936a]"
              />
              <span className="flex-1 text-sm text-[#2c1810]">{s.nome}</span>
              <span className="text-xs text-[#9a7060]">{s.duracao}min · R$ {Number(s.preco).toFixed(2)}</span>
            </label>
          ))}
        </div>
      </div>

      {erro && <p className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2">{erro}</p>}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-[#b5936a] hover:bg-[#9a7a55] text-white font-bold py-2.5 rounded-xl transition-colors disabled:opacity-50"
        >
          {loading ? 'Salvando...' : 'Salvar'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 border border-[#ddd6ce] text-[#7a5c4a] font-bold py-2.5 rounded-xl hover:bg-[#fdf8f4] transition-colors"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

export default function ComboManager() {
  const [combos, setCombos] = useState([]);
  const [servicos, setServicos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState(null); // null | 'novo' | combo object
  const [erro, setErro] = useState('');

  async function carregar() {
    setLoading(true);
    setErro('');
    try {
      const [{ combos: lista }, { servicos: svcs }] = await Promise.all([
        listarCombosAdmin(),
        listarServicosAdmin({ limit: 200 }),
      ]);
      setCombos(lista || []);
      setServicos(svcs || []);
    } catch (err) {
      setErro(err.message || 'Erro ao carregar');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { carregar(); }, []);

  async function handleDesativar(id) {
    if (!window.confirm('Desativar este combo?')) return;
    try {
      await desativarComboAdmin(id);
      carregar();
    } catch (err) {
      setErro(err.message || 'Erro ao desativar');
    }
  }

  function handleSaved() {
    setEditando(null);
    carregar();
  }

  if (editando !== null) {
    return (
      <div className="p-2">
        <ComboForm
          combo={editando === 'novo' ? null : editando}
          servicos={servicos}
          onSave={handleSaved}
          onCancel={() => setEditando(null)}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-bold text-[#2c1810]">Combos</h2>
        <button
          onClick={() => setEditando('novo')}
          className="bg-[#b5936a] hover:bg-[#9a7a55] text-white font-bold px-5 py-2.5 rounded-xl transition-colors text-sm"
        >
          + Novo combo
        </button>
      </div>

      {erro && <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">{erro}</p>}

      {loading ? (
        <p className="text-sm text-[#9a7060] py-8 text-center">Carregando...</p>
      ) : combos.length === 0 ? (
        <div className="text-center py-16 text-[#9a7060]">
          <p className="text-lg font-semibold mb-1">Nenhum combo cadastrado</p>
          <p className="text-sm">Crie o primeiro combo para oferecer pacotes às clientes.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {combos.map((combo) => {
            const duracaoTotal = combo.itens?.reduce((s, i) => s + i.servico.duracao, 0) || 0;
            return (
              <div key={combo.id} className="bg-white rounded-2xl border border-[#ede8e1] p-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-bold text-[#2c1810]">{combo.nome}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${STATUS_COLORS[combo.ativo]}`}>
                      {combo.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                  {combo.descricao && <p className="text-sm text-[#7a5c4a] mb-1">{combo.descricao}</p>}
                  <div className="flex items-center gap-3 text-sm text-[#9a7060] mb-2">
                    <span className="font-bold text-[#5c3d2e]">R$ {Number(combo.preco).toFixed(2).replace('.', ',')}</span>
                    {duracaoTotal > 0 && (
                      <span>
                        {Math.floor(duracaoTotal / 60) > 0 ? `${Math.floor(duracaoTotal / 60)}h ` : ''}
                        {duracaoTotal % 60 > 0 ? `${duracaoTotal % 60}min` : ''}
                      </span>
                    )}
                  </div>
                  <ul className="flex flex-wrap gap-1.5">
                    {combo.itens?.map((item) => (
                      <li key={item.id} className="bg-[#fdf8f4] border border-[#ede8e1] text-xs text-[#7a5c4a] px-2.5 py-1 rounded-full">
                        {item.servico.nome}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => setEditando(combo)}
                    className="text-sm font-semibold text-[#b5936a] hover:text-[#9a7a55] border border-[#ddd6ce] px-4 py-2 rounded-xl hover:bg-[#fdf8f4] transition-colors"
                  >
                    Editar
                  </button>
                  {combo.ativo && (
                    <button
                      onClick={() => handleDesativar(combo.id)}
                      className="text-sm font-semibold text-red-500 hover:text-red-700 border border-red-200 px-4 py-2 rounded-xl hover:bg-red-50 transition-colors"
                    >
                      Desativar
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

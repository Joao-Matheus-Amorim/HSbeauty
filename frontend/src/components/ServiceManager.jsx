import { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Edit2,
  Check,
  X,
  AlertCircle,
  Eye,
  EyeOff,
  DollarSign,
  Clock,
} from 'lucide-react';
import {
  listarServicosAdmin,
  criarServicoAdmin,
  atualizarServicoAdmin
} from '../services/admin';
import { clsx } from 'clsx';
import ImageUpload from './ImageUpload';

export default function ServiceManager() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    preco: '',
    duracao: '',
    categoria: '',
    imagemUrl: '',
    ativo: true,
  });

  const loadServices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listarServicosAdmin();
      setServices(data.servicos || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;

    listarServicosAdmin()
      .then((data) => {
        if (ignore) return;
        setError(null);
        setServices(data.servicos || []);
      })
      .catch((err) => {
        if (ignore) return;
        setError(err.message);
      })
      .finally(() => {
        if (ignore) return;
        setLoading(false);
      });

    return () => { ignore = true; };
  }, [loadServices]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setActionError(null);
    try {
      const payload = {
        ...formData,
        preco: parseFloat(formData.preco),
        duracao: parseInt(formData.duracao),
      };

      if (editingService) {
        await atualizarServicoAdmin(editingService.id, payload);
      } else {
        await criarServicoAdmin(payload);
      }

      setIsModalOpen(false);
      resetForm();
      loadServices();
    } catch (err) {
      // Erro exibido dentro do modal, não como alert
      setActionError(err.message);
    }
  };

  const handleEdit = (service) => {
    setEditingService(service);
    setActionError(null);
    setFormData({
      nome: service.nome,
      descricao: service.descricao || '',
      preco: service.preco.toString(),
      duracao: service.duracao.toString(),
      categoria: service.categoria || '',
      imagemUrl: service.imagemUrl || '',
      ativo: service.ativo,
    });
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (service) => {
    setActionError(null);
    try {
      await atualizarServicoAdmin(service.id, { ativo: !service.ativo });
      loadServices();
    } catch (err) {
      setActionError('Erro ao alterar status: ' + err.message);
    }
  };

  const resetForm = () => {
    setEditingService(null);
    setActionError(null);
    setFormData({ nome: '', descricao: '', preco: '', duracao: '', categoria: '', imagemUrl: '', ativo: true });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">Catálogo de Serviços</h2>
        <button
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="bg-[#b5936a] text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-[#c5a37a] transition-colors shadow-lg shadow-[#b5936a]/20"
        >
          <Plus className="w-5 h-5" /> Novo Serviço
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Erro de ação (toggle status) — exibido inline, sem alert() */}
      {actionError && !isModalOpen && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-3" role="alert">
          <AlertCircle className="w-5 h-5" />
          <span>{actionError}</span>
          <button type="button" onClick={() => setActionError(null)} className="ml-auto text-sm underline">Fechar</button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-12 text-center text-gray-400">Carregando serviços...</div>
        ) : services.length === 0 ? (
          <div className="col-span-full py-12 text-center text-gray-400">Nenhum serviço cadastrado.</div>
        ) : (
          services.map((service) => (
            <div
              key={service.id}
              className={clsx(
                'bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col transition-all hover:shadow-md',
                !service.ativo && 'opacity-75 grayscale-[0.5]'
              )}
            >
              <div className="flex justify-between items-start mb-4">
                <div className={clsx(
                  'px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider',
                  service.ativo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                )}>
                  {service.ativo ? 'Ativo' : 'Inativo'}
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleEdit(service)}
                    className="p-2 text-gray-400 hover:text-[#b5936a] hover:bg-gray-50 rounded-lg transition-colors"
                    aria-label={`Editar ${service.nome}`}
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleToggleStatus(service)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                    aria-label={service.ativo ? `Desativar ${service.nome}` : `Ativar ${service.nome}`}
                  >
                    {service.ativo ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <h3 className="text-lg font-bold text-gray-900 mb-1">{service.nome}</h3>
              <p className="text-sm text-gray-500 line-clamp-2 mb-4 flex-1">
                {service.descricao || 'Sem descrição cadastrada.'}
              </p>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-50">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-[#b5936a]" />
                  <span className="text-sm font-bold text-gray-900">
                    R$ {Number(service.preco).toFixed(2).replace('.', ',')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">{service.duracao} min</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-xl font-bold text-gray-800">
                {editingService ? 'Editar Serviço' : 'Novo Serviço'}
              </h3>
              <button onClick={() => { setIsModalOpen(false); resetForm(); }} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Erro do submit exibido dentro do modal */}
              {actionError && (
                <div className="bg-red-50 text-red-600 p-3 rounded-xl flex items-center gap-2 text-sm" role="alert">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{actionError}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Nome do Serviço</label>
                <input
                  required
                  type="text"
                  className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[#b5936a]"
                  placeholder="Ex: Unhas em Gel"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Preço (R$)</label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    min="0"
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[#b5936a]"
                    placeholder="0.00"
                    value={formData.preco}
                    onChange={(e) => setFormData({ ...formData, preco: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Duração (min)</label>
                  <input
                    required
                    type="number"
                    min="1"
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[#b5936a]"
                    placeholder="60"
                    value={formData.duracao}
                    onChange={(e) => setFormData({ ...formData, duracao: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">
                  Categoria <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[#b5936a]"
                  placeholder="Ex: Unhas, Cílios, Spa Labial..."
                  value={formData.categoria}
                  onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                />
                <p className="text-xs text-gray-500 ml-1">
                  Define em qual aba do carrossel o serviço aparece. Serviços sem categoria não são exibidos no site público.
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Descrição</label>
                <textarea
                  className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[#b5936a] min-h-[100px]"
                  placeholder="Detalhes sobre o serviço..."
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Imagem</label>
                <ImageUpload
                  value={formData.imagemUrl}
                  onChange={(url) => setFormData({ ...formData, imagemUrl: url })}
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="ativo"
                  className="w-5 h-5 rounded border-gray-300 text-[#b5936a] focus:ring-[#b5936a]"
                  checked={formData.ativo}
                  onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
                />
                <label htmlFor="ativo" className="text-sm font-medium text-gray-700">
                  Serviço ativo e visível no site
                </label>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => { setIsModalOpen(false); resetForm(); }}
                  className="flex-1 px-6 py-3 bg-gray-100 text-gray-600 rounded-2xl font-bold hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-[#b5936a] text-white rounded-2xl font-bold hover:bg-[#c5a37a] transition-colors shadow-lg shadow-[#b5936a]/20"
                >
                  {editingService ? 'Salvar Alterações' : 'Criar Serviço'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

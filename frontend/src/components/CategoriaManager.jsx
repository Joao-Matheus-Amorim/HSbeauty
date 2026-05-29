import { useState, useEffect } from 'react';
import { Plus, Edit2, X, AlertCircle, Eye, EyeOff, FolderTree } from 'lucide-react';
import {
  listarCategoriasAdmin,
  criarCategoriaAdmin,
  atualizarCategoriaAdmin,
} from '../services/admin';
import { clsx } from 'clsx';
import ImageUpload from './ImageUpload';

const EMPTY_FORM = { nome: '', imagemUrl: '', ordem: '0', ativo: true };

export default function CategoriaManager() {
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);

  async function loadCategorias() {
    setLoading(true);
    setError(null);
    try {
      const data = await listarCategoriasAdmin();
      setCategorias(data.categorias || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let ignore = false;
    listarCategoriasAdmin()
      .then((data) => { if (!ignore) { setCategorias(data.categorias || []); setError(null); } })
      .catch((err) => { if (!ignore) setError(err.message); })
      .finally(() => { if (!ignore) setLoading(false); });
    return () => { ignore = true; };
  }, []);

  function resetForm() {
    setEditing(null);
    setActionError(null);
    setFormData(EMPTY_FORM);
  }

  function openCreate() {
    resetForm();
    setIsModalOpen(true);
  }

  function openEdit(categoria) {
    setEditing(categoria);
    setActionError(null);
    setFormData({
      nome: categoria.nome,
      imagemUrl: categoria.imagemUrl || '',
      ordem: String(categoria.ordem ?? 0),
      ativo: categoria.ativo,
    });
    setIsModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setActionError(null);
    const payload = {
      nome: formData.nome.trim(),
      imagemUrl: formData.imagemUrl?.trim() ? formData.imagemUrl.trim() : null,
      ordem: Number(formData.ordem) || 0,
      ativo: formData.ativo,
    };
    try {
      if (editing) {
        await atualizarCategoriaAdmin(editing.id, payload);
      } else {
        await criarCategoriaAdmin(payload);
      }
      setIsModalOpen(false);
      resetForm();
      loadCategorias();
    } catch (err) {
      setActionError(err.message);
    }
  }

  async function handleToggleStatus(categoria) {
    setActionError(null);
    try {
      await atualizarCategoriaAdmin(categoria.id, { ativo: !categoria.ativo });
      loadCategorias();
    } catch (err) {
      setActionError('Erro ao alterar status: ' + err.message);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">Categorias</h2>
        <button
          onClick={openCreate}
          className="bg-[#b5936a] text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-[#c5a37a] transition-colors shadow-lg shadow-[#b5936a]/20"
        >
          <Plus className="w-5 h-5" /> Nova Categoria
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-3" role="alert">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {actionError && !isModalOpen && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-3" role="alert">
          <AlertCircle className="w-5 h-5" />
          <span>{actionError}</span>
          <button type="button" onClick={() => setActionError(null)} className="ml-auto text-sm underline">Fechar</button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-12 text-center text-gray-400">Carregando categorias...</div>
        ) : categorias.length === 0 ? (
          <div className="col-span-full py-12 text-center text-gray-400">
            Nenhuma categoria cadastrada. Crie a primeira para começar a organizar seus serviços.
          </div>
        ) : (
          categorias.map((categoria) => {
            const total = categoria._count?.servicos ?? 0;
            return (
              <div
                key={categoria.id}
                className={clsx(
                  'bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col transition-all hover:shadow-md',
                  !categoria.ativo && 'opacity-75 grayscale-[0.4]'
                )}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className={clsx(
                    'px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider',
                    categoria.ativo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                  )}>
                    {categoria.ativo ? 'Ativa' : 'Inativa'}
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => openEdit(categoria)}
                      className="p-2 text-gray-400 hover:text-[#b5936a] hover:bg-gray-50 rounded-lg transition-colors"
                      aria-label={`Editar ${categoria.nome}`}
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleToggleStatus(categoria)}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                      aria-label={categoria.ativo ? `Desativar ${categoria.nome}` : `Ativar ${categoria.nome}`}
                    >
                      {categoria.ativo ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-3 mb-3">
                  {categoria.imagemUrl ? (
                    <img
                      src={categoria.imagemUrl}
                      alt={categoria.nome}
                      className="w-12 h-12 rounded-2xl object-cover border border-gray-100"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-300">
                      <FolderTree className="w-5 h-5" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <h3 className="text-lg font-bold text-gray-900 truncate">{categoria.nome}</h3>
                    <p className="text-xs text-gray-400">Ordem: {categoria.ordem ?? 0}</p>
                  </div>
                </div>

                <div className="mt-auto pt-4 border-t border-gray-50 text-xs text-gray-500">
                  {total} {total === 1 ? 'serviço vinculado' : 'serviços vinculados'}
                </div>
              </div>
            );
          })
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-xl font-bold text-gray-800">
                {editing ? 'Editar Categoria' : 'Nova Categoria'}
              </h3>
              <button
                onClick={() => { setIsModalOpen(false); resetForm(); }}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Fechar"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {actionError && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-3" role="alert">
                  <AlertCircle className="w-5 h-5" />
                  <span>{actionError}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">
                  Nome <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={60}
                  className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[#b5936a]"
                  placeholder="Ex: Unhas, Cílios, Spa Labial"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">
                  Imagem
                </label>
                <ImageUpload
                  value={formData.imagemUrl}
                  onChange={(url) => setFormData({ ...formData, imagemUrl: url || '' })}
                />
                <p className="text-xs text-gray-500 ml-1">
                  Aparece no card 3D do carrossel público. Recomendado quadrada (1:1), ≥ 400×400.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Ordem</label>
                  <input
                    type="number"
                    min={0}
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[#b5936a]"
                    value={formData.ordem}
                    onChange={(e) => setFormData({ ...formData, ordem: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Status</label>
                  <label className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-2xl cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-5 h-5"
                      checked={formData.ativo}
                      onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
                    />
                    <span className="text-sm font-bold text-gray-700">
                      {formData.ativo ? 'Ativa' : 'Inativa'}
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setIsModalOpen(false); resetForm(); }}
                  className="flex-1 py-3 rounded-2xl border border-gray-200 text-gray-700 font-bold hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-2xl bg-[#b5936a] text-white font-bold hover:bg-[#c5a37a]"
                >
                  {editing ? 'Salvar alterações' : 'Criar categoria'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

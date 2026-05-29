import { useEffect, useState } from 'react';
import { getSiteConfigAdmin, updateSiteConfigAdmin } from '../services/admin';
import ImageUpload from './ImageUpload';

const DIAS_SEMANA = [
  { id: 0, label: 'Domingo' },
  { id: 1, label: 'Segunda' },
  { id: 2, label: 'Terça' },
  { id: 3, label: 'Quarta' },
  { id: 4, label: 'Quinta' },
  { id: 5, label: 'Sexta' },
  { id: 6, label: 'Sábado' },
];

export default function SiteConfigManager() {
  const [bannerUrl, setBannerUrl] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [aberturaHora, setAberturaHora] = useState(9);
  const [fechamentoHora, setFechamentoHora] = useState(18);
  const [diasFechados, setDiasFechados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  useEffect(() => {
    let ignore = false;
    getSiteConfigAdmin()
      .then((config) => {
        if (ignore) return;
        setBannerUrl(config.bannerUrl || '');
        setLogoUrl(config.logoUrl || '');
        setAberturaHora(config.aberturaHora ?? 9);
        setFechamentoHora(config.fechamentoHora ?? 18);
        setDiasFechados(Array.isArray(config.diasFechados) ? config.diasFechados : []);
      })
      .catch((err) => { if (!ignore) setErro(err.message || 'Erro ao carregar'); })
      .finally(() => { if (!ignore) setLoading(false); });
    return () => { ignore = true; };
  }, []);

  function toggleDia(id) {
    setDiasFechados((atual) => atual.includes(id) ? atual.filter((d) => d !== id) : [...atual, id].sort((a, b) => a - b));
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setErro('');
    setSucesso('');
    try {
      await updateSiteConfigAdmin({
        bannerUrl,
        logoUrl,
        aberturaHora,
        fechamentoHora,
        diasFechados,
      });
      setSucesso('Configurações salvas com sucesso!');
      setTimeout(() => setSucesso(''), 3000);
    } catch (err) {
      setErro(err.message || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-[#9a7060] py-8 text-center">Carregando...</p>;
  }

  return (
    <form onSubmit={handleSave} className="max-w-2xl flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold text-[#2c1810] mb-1">Configurações do site</h2>
        <p className="text-sm text-[#9a7060]">Imagens, horário de funcionamento e dias fechados.</p>
      </div>

      <div className="bg-white rounded-2xl border border-[#ede8e1] p-5 flex flex-col gap-3">
        <div>
          <span className="text-sm font-bold text-[#5c3d2e]">Banner principal</span>
          <p className="text-xs text-[#9a7060] mt-0.5">Imagem grande exibida no topo da landing page. Recomendado: 1200×1200px.</p>
        </div>
        <ImageUpload value={bannerUrl} onChange={setBannerUrl} disabled={saving} />
      </div>

      <div className="bg-white rounded-2xl border border-[#ede8e1] p-5 flex flex-col gap-3">
        <div>
          <span className="text-sm font-bold text-[#5c3d2e]">Logo</span>
          <p className="text-xs text-[#9a7060] mt-0.5">Imagem quadrada usada no topo do site. Recomendado: 200×200px.</p>
        </div>
        <ImageUpload value={logoUrl} onChange={setLogoUrl} disabled={saving} />
      </div>

      <div className="bg-white rounded-2xl border border-[#ede8e1] p-5 flex flex-col gap-3">
        <div>
          <span className="text-sm font-bold text-[#5c3d2e]">Horário de atendimento</span>
          <p className="text-xs text-[#9a7060] mt-0.5">Define a janela de slots disponíveis no calendário público.</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Abertura</span>
            <input
              type="number"
              min={0}
              max={23}
              required
              value={aberturaHora}
              onChange={(e) => setAberturaHora(Number(e.target.value))}
              className="px-3 py-2 bg-gray-50 rounded-xl focus:ring-2 focus:ring-[#b5936a]"
              disabled={saving}
            />
            <span className="text-[10px] text-[#9a7060]">Hora em formato 0–23 (ex.: 9 = 09h)</span>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Fechamento</span>
            <input
              type="number"
              min={1}
              max={24}
              required
              value={fechamentoHora}
              onChange={(e) => setFechamentoHora(Number(e.target.value))}
              className="px-3 py-2 bg-gray-50 rounded-xl focus:ring-2 focus:ring-[#b5936a]"
              disabled={saving}
            />
            <span className="text-[10px] text-[#9a7060]">Último slot termina aqui (ex.: 18 = 18h)</span>
          </label>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#ede8e1] p-5 flex flex-col gap-3">
        <div>
          <span className="text-sm font-bold text-[#5c3d2e]">Dias fechados</span>
          <p className="text-xs text-[#9a7060] mt-0.5">Selecione os dias da semana em que não há atendimento.</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {DIAS_SEMANA.map((dia) => {
            const ativo = diasFechados.includes(dia.id);
            return (
              <button
                key={dia.id}
                type="button"
                onClick={() => toggleDia(dia.id)}
                disabled={saving}
                className={`px-3 py-2 rounded-xl text-sm font-bold border transition-colors ${
                  ativo
                    ? 'bg-[#c0394f] text-white border-[#c0394f]'
                    : 'bg-gray-50 text-[#5c3d2e] border-gray-200 hover:bg-gray-100'
                }`}
              >
                {dia.label}
              </button>
            );
          })}
        </div>
      </div>

      {erro && <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3" role="alert">{erro}</p>}
      {sucesso && <p className="text-sm text-emerald-700 bg-emerald-50 rounded-xl px-4 py-3">{sucesso}</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="bg-[#b5936a] hover:bg-[#9a7a55] text-white font-bold px-6 py-2.5 rounded-xl transition-colors disabled:opacity-50"
        >
          {saving ? 'Salvando...' : 'Salvar alterações'}
        </button>
      </div>
    </form>
  );
}

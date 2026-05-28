import { useCallback, useEffect, useState } from 'react';
import { getSiteConfigAdmin, updateSiteConfigAdmin } from '../services/admin';
import ImageUpload from './ImageUpload';

export default function SiteConfigManager() {
  const [bannerUrl, setBannerUrl] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  const carregar = useCallback(() => {
    setLoading(true);
    setErro('');
    getSiteConfigAdmin()
      .then((config) => {
        setBannerUrl(config.bannerUrl || '');
        setLogoUrl(config.logoUrl || '');
      })
      .catch((err) => setErro(err.message || 'Erro ao carregar'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let ignore = false;
    getSiteConfigAdmin()
      .then((config) => {
        if (ignore) return;
        setBannerUrl(config.bannerUrl || '');
        setLogoUrl(config.logoUrl || '');
      })
      .catch((err) => { if (!ignore) setErro(err.message || 'Erro ao carregar'); })
      .finally(() => { if (!ignore) setLoading(false); });
    return () => { ignore = true; };
  }, [carregar]);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setErro('');
    setSucesso('');
    try {
      await updateSiteConfigAdmin({ bannerUrl, logoUrl });
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
        <p className="text-sm text-[#9a7060]">Personalize o banner e o logo exibidos na página pública.</p>
      </div>

      <div className="bg-white rounded-2xl border border-[#ede8e1] p-5 flex flex-col gap-3">
        <div>
          <span className="text-sm font-bold text-[#5c3d2e]">Banner principal</span>
          <p className="text-xs text-[#9a7060] mt-0.5">Imagem grande exibida no topo da landing page. Recomendado: 1200×600px.</p>
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

      {erro && <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">{erro}</p>}
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

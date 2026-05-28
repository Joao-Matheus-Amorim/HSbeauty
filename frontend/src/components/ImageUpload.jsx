import { useState } from 'react';
import { isCloudinaryConfigured, uploadImage } from '../services/cloudinary';

export default function ImageUpload({ value, onChange, disabled }) {
  const [uploading, setUploading] = useState(false);
  const [erro, setErro] = useState('');

  if (!isCloudinaryConfigured()) {
    return (
      <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
        Upload indisponível: configure VITE_CLOUDINARY_CLOUD_NAME e VITE_CLOUDINARY_UPLOAD_PRESET no Vercel.
      </div>
    );
  }

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErro('Selecione um arquivo de imagem');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErro('Imagem muito grande (máx 5MB)');
      return;
    }

    setUploading(true);
    setErro('');
    try {
      const url = await uploadImage(file);
      onChange(url);
    } catch (err) {
      setErro(err.message || 'Erro no upload');
    } finally {
      setUploading(false);
    }
  }

  function handleRemove() {
    onChange('');
  }

  return (
    <div className="flex flex-col gap-2">
      {value && (
        <div className="relative w-32 h-32 rounded-xl overflow-hidden border border-[#ede8e1] bg-[#fdf8f4]">
          <img src={value} alt="Imagem do serviço" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-1 right-1 bg-black/60 hover:bg-black/80 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center"
            aria-label="Remover imagem"
          >
            ×
          </button>
        </div>
      )}

      <label className="inline-flex items-center gap-2 cursor-pointer">
        <input
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFile}
          disabled={disabled || uploading}
          className="hidden"
        />
        <span className="text-sm font-semibold text-[#b5936a] border border-[#ddd6ce] px-4 py-2 rounded-xl hover:bg-[#fdf8f4] transition-colors">
          {uploading ? 'Enviando...' : value ? 'Trocar imagem' : 'Escolher imagem'}
        </span>
      </label>

      {erro && <p className="text-xs text-red-600">{erro}</p>}
    </div>
  );
}

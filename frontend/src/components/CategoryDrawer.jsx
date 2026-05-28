import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { formatDuracao } from '../utils/date-utils';
import './CategoryDrawer.css';

function formatPreco(valor) {
  if (valor === null || valor === undefined || valor === '') return '';
  return `R$ ${Number(valor).toFixed(2).replace('.', ',')}`;
}

export default function CategoryDrawer({ categoria, onClose, onSelectServico }) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    function handleEsc(e) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', handleEsc);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  if (!categoria) return null;

  const content = (
    <div
      className="cat-drawer-backdrop"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="presentation"
    >
      <div className="cat-drawer" role="dialog" aria-modal="true" aria-label={`Serviços de ${categoria.nome}`}>
        <div className="cat-drawer-handle" aria-hidden="true" />
        <header className="cat-drawer-header">
          <div>
            <span className="cat-drawer-eyebrow">Categoria</span>
            <h2 className="cat-drawer-title">{categoria.nome}</h2>
          </div>
          <button type="button" className="cat-drawer-close" onClick={onClose} aria-label="Fechar">×</button>
        </header>

        <div className="cat-drawer-list">
          {categoria.servicos.length === 0 ? (
            <p className="cat-drawer-empty">Nenhum serviço cadastrado nesta categoria.</p>
          ) : (
            categoria.servicos.map((servico) => (
              <button
                key={servico.id || servico.nome}
                type="button"
                className="cat-drawer-item"
                onClick={() => onSelectServico(servico)}
              >
                <div className="cat-drawer-item-info">
                  <span className="cat-drawer-item-name">{servico.nome}</span>
                  {servico.descricao && (
                    <span className="cat-drawer-item-desc">{servico.descricao}</span>
                  )}
                  <span className="cat-drawer-item-meta">
                    {formatDuracao(servico.duracao) || '—'}
                    {servico.preco !== undefined && servico.preco !== null && ` · a partir de ${formatPreco(servico.preco)}`}
                  </span>
                </div>
                <span className="cat-drawer-item-cta" aria-hidden="true">›</span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}

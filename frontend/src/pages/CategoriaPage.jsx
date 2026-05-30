import { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { listarServicos, listarCategorias } from '../services/agendamentos';
import { SERVICOS_PADRAO, CATEGORIAS_PADRAO, WHATSAPP } from '../constants';
import { formatDuracao } from '../utils/date-utils';
import './CategoriaPage.css';

const AgendamentoModal = lazy(() => import('../components/AgendamentoModal'));

function formatPreco(valor) {
  return `R$ ${Number(valor).toFixed(2).replace('.', ',')}`;
}

function initials(nome) {
  const clean = String(nome || '').trim();
  if (!clean) return 'HS';
  return clean.slice(0, 1).toUpperCase();
}

export default function CategoriaPage() {
  const { categoriaId } = useParams();
  const navigate = useNavigate();
  const [servicos, setServicos] = useState(SERVICOS_PADRAO);
  const [categorias, setCategorias] = useState(CATEGORIAS_PADRAO);
  const [loading, setLoading] = useState(true);
  const [servicoModal, setServicoModal] = useState(null);

  useEffect(() => {
    let mounted = true;
    Promise.allSettled([
      listarServicos({ ativo: true }),
      listarCategorias(),
    ]).then(([servResult, catResult]) => {
      if (!mounted) return;
      // Sucesso (mesmo com array vazio) substitui o fallback —
      // evita renderizar servicos fantasma que nao existem no banco.
      if (servResult.status === 'fulfilled' && Array.isArray(servResult.value)) {
        setServicos(servResult.value);
      }
      if (catResult.status === 'fulfilled' && Array.isArray(catResult.value)) {
        setCategorias(catResult.value);
      }
      setLoading(false);
    });
    return () => { mounted = false; };
  }, []);

  const categoria = useMemo(
    () => categorias.find((c) => String(c.id) === String(categoriaId)) || null,
    [categorias, categoriaId]
  );

  const servicosDaCategoria = useMemo(
    () => servicos.filter((s) => {
      const cid = s.categoria?.id ?? s.categoriaId;
      return String(cid) === String(categoriaId);
    }),
    [servicos, categoriaId]
  );

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [categoriaId]);

  if (loading && !categoria) {
    return (
      <main className="cat-page">
        <p className="cat-page-empty">Carregando…</p>
      </main>
    );
  }

  if (!categoria) {
    return (
      <main className="cat-page">
        <header className="cat-page-topbar">
          <Link to="/" className="cat-page-back" aria-label="Voltar">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5m0 0 7-7m-7 7 7 7"/></svg>
            <span>Voltar</span>
          </Link>
        </header>
        <p className="cat-page-empty">Categoria não encontrada.</p>
      </main>
    );
  }

  return (
    <main className="cat-page">
      {servicoModal && (
        <Suspense fallback={null}>
          <AgendamentoModal
            servicoInicial={servicoModal}
            categoriaInicial={categoria}
            onClose={() => setServicoModal(null)}
          />
        </Suspense>
      )}

      <header className="cat-page-topbar">
        <button type="button" onClick={() => navigate('/')} className="cat-page-back" aria-label="Voltar para a home">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5m0 0 7-7m-7 7 7 7"/></svg>
          <span>Voltar</span>
        </button>
      </header>

      <section className="cat-page-hero">
        <div className="cat-page-hero-image" aria-hidden="true">
          {categoria.imagemUrl ? (
            <img src={categoria.imagemUrl} alt="" />
          ) : (
            <span className="cat-page-hero-glyph">{initials(categoria.nome)}</span>
          )}
          <div className="cat-page-hero-gradient" />
        </div>
        <div className="cat-page-hero-content">
          <span className="cat-page-hero-eyebrow">Categoria</span>
          <h1 className="cat-page-hero-title">{categoria.nome}</h1>
          <p className="cat-page-hero-sub">
            {servicosDaCategoria.length} {servicosDaCategoria.length === 1 ? 'serviço disponível' : 'serviços disponíveis'}
          </p>
        </div>
      </section>

      <section className="cat-page-list" aria-label={`Serviços de ${categoria.nome}`}>
        {servicosDaCategoria.length === 0 ? (
          <div className="cat-page-empty-state" role="status">
            <div className="cat-page-empty-ornament" aria-hidden="true">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9" />
                <path d="M9 12l2 2 4-4" />
              </svg>
            </div>
            <span className="cat-page-empty-eyebrow">Em breve</span>
            <h2 className="cat-page-empty-title">Esta categoria está sendo preparada.</h2>
            <p className="cat-page-empty-sub">
              Os serviços de <em>{categoria.nome.toLowerCase()}</em> estarão disponíveis em instantes. Enquanto isso, escolha outra categoria ou fale com a gente.
            </p>
            <div className="cat-page-empty-actions">
              <button type="button" className="cat-page-empty-btn primary" onClick={() => navigate('/')}>
                Ver outras categorias
              </button>
              <a
                href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(`Olá! Tenho interesse em serviços de ${categoria.nome}.`)}`}
                target="_blank"
                rel="noreferrer"
                className="cat-page-empty-btn secondary"
              >
                Falar no WhatsApp
              </a>
            </div>
          </div>
        ) : (
          <ul className="cat-service-list">
            {servicosDaCategoria.map((s) => (
              <li key={s.id} className="cat-service-item">
                <button type="button" className="cat-service-button" onClick={() => setServicoModal(s)}>
                  <div className="cat-service-thumb" aria-hidden="true">
                    {s.imagemUrl ? (
                      <img src={s.imagemUrl} alt="" loading="lazy" />
                    ) : (
                      <span>{initials(s.nome)}</span>
                    )}
                  </div>
                  <div className="cat-service-info">
                    <h3 className="cat-service-name">{s.nome}</h3>
                    {s.descricao && <p className="cat-service-desc">{s.descricao}</p>}
                    <div className="cat-service-meta">
                      <span className="cat-service-price">{formatPreco(s.preco)}</span>
                      {s.duracao ? <span className="cat-service-dur">{formatDuracao(s.duracao)}</span> : null}
                    </div>
                  </div>
                  <span className="cat-service-cta" aria-hidden="true">
                    Marcar
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

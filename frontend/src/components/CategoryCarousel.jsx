import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import './CategoryCarousel.css';

function categoryInitials(nome) {
  const clean = String(nome || '').trim();
  if (!clean) return 'HS';
  const parts = clean.split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return clean.slice(0, 2).toUpperCase();
}

export default function CategoryCarousel({ categorias, onSelect }) {
  const trackRef = useRef(null);
  const cardsRef = useRef([]);
  const rafRef = useRef(0);
  const [activeIndex, setActiveIndex] = useState(0);

  const updateTilts = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const viewportCenter = track.scrollLeft + track.clientWidth / 2;

    let closestIdx = 0;
    let closestDist = Infinity;

    cardsRef.current.forEach((card, idx) => {
      if (!card) return;
      const cardCenter = card.offsetLeft + card.offsetWidth / 2;
      const delta = cardCenter - viewportCenter;
      const norm = Math.max(-1.4, Math.min(1.4, delta / (card.offsetWidth * 0.9)));
      const abs = Math.abs(norm);

      card.style.setProperty('--tilt', `${-norm * 28}deg`);
      card.style.setProperty('--depth', `${-abs * 90}px`);
      card.style.setProperty('--scale', `${1 - abs * 0.12}`);
      card.style.setProperty('--opacity', `${1 - abs * 0.35}`);
      card.style.setProperty('--shift', `${norm * 8}px`);

      if (abs < closestDist) {
        closestDist = abs;
        closestIdx = idx;
      }
    });

    setActiveIndex(closestIdx);
  }, []);

  const scheduleUpdate = useCallback(() => {
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = 0;
      updateTilts();
    });
  }, [updateTilts]);

  useLayoutEffect(() => {
    updateTilts();
  }, [categorias, updateTilts]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return undefined;
    track.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate);
    return () => {
      track.removeEventListener('scroll', scheduleUpdate);
      window.removeEventListener('resize', scheduleUpdate);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [scheduleUpdate]);

  const scrollToIndex = useCallback((idx) => {
    const track = trackRef.current;
    const card = cardsRef.current[idx];
    if (!track || !card) return;
    const target = card.offsetLeft + card.offsetWidth / 2 - track.clientWidth / 2;
    if (typeof track.scrollTo === 'function') {
      track.scrollTo({ left: target, behavior: 'smooth' });
    } else {
      track.scrollLeft = target;
    }
  }, []);

  if (!categorias.length) return null;

  return (
    <div className="cat-carousel">
      <div className="cat-carousel-viewport">
        <div className="cat-carousel-track" ref={trackRef}>
          <div className="cat-carousel-spacer" aria-hidden="true" />
          {categorias.map((cat, idx) => (
            <button
              type="button"
              key={cat.nome}
              ref={(el) => { cardsRef.current[idx] = el; }}
              className={`cat-card${idx === activeIndex ? ' is-focus' : ''}`}
              onClick={() => {
                scrollToIndex(idx);
                onSelect(cat);
              }}
              aria-label={`Categoria ${cat.nome} — ${cat.servicos.length} ${cat.servicos.length === 1 ? 'serviço' : 'serviços'}`}
            >
              <div className="cat-card-face">
                <span className="cat-card-glyph" aria-hidden="true">{categoryInitials(cat.nome)}</span>
                <h4 className="cat-card-name">{cat.nome}</h4>
                <span className="cat-card-count">
                  {cat.servicos.length} {cat.servicos.length === 1 ? 'serviço' : 'serviços'}
                </span>
              </div>
              <div className="cat-card-mirror" aria-hidden="true">
                <span className="cat-card-glyph">{categoryInitials(cat.nome)}</span>
                <h4 className="cat-card-name">{cat.nome}</h4>
              </div>
            </button>
          ))}
          <div className="cat-carousel-spacer" aria-hidden="true" />
        </div>
      </div>
      <div className="cat-carousel-dots" role="tablist" aria-label="Categorias">
        {categorias.map((cat, idx) => (
          <button
            key={cat.nome}
            type="button"
            role="tab"
            aria-selected={idx === activeIndex}
            aria-label={cat.nome}
            className={`cat-dot${idx === activeIndex ? ' is-active' : ''}`}
            onClick={() => scrollToIndex(idx)}
          />
        ))}
      </div>
    </div>
  );
}

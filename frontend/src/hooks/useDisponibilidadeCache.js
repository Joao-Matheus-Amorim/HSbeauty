import { useEffect, useRef, useState } from 'react';
import { buscarDisponibilidade } from '../services/agendamentos';

/**
 * Cache de disponibilidade por dia.
 *
 * - Reinicializa quando `tipo` ou `idAtivo` mudam (cancela requests em voo).
 * - Pre-busca todos os dias da semana atual em paralelo.
 * - `prefetchDay(dia)` busca sob demanda (usado pelo sub-modal de mais datas).
 *
 * Estado por dia: `{ status: 'loading' | 'ready' | 'error', slots: [], message? }`
 */
export function useDisponibilidadeCache({ tipo, idAtivo, semanaAtual }) {
  const [availability, setAvailability] = useState({});
  const fetchTokenRef = useRef(0);

  useEffect(() => {
    if (!idAtivo || !semanaAtual.length) return;
    fetchTokenRef.current += 1;
    const token = fetchTokenRef.current;

    Promise.resolve().then(() => {
      if (token !== fetchTokenRef.current) return;
      setAvailability((prev) => {
        const inicial = {};
        semanaAtual.forEach((dia) => {
          inicial[dia.value] = prev[dia.value] || { status: 'loading', slots: [] };
        });
        return inicial;
      });

      semanaAtual.forEach(async (dia) => {
        try {
          const res = tipo === 'servico'
            ? await buscarDisponibilidade(dia.value, idAtivo)
            : await buscarDisponibilidade(dia.value, null, idAtivo);
          if (token !== fetchTokenRef.current) return;
          setAvailability((prev) => ({
            ...prev,
            [dia.value]: { status: 'ready', slots: res.slotsDisponiveis || [] },
          }));
        } catch (err) {
          if (token !== fetchTokenRef.current) return;
          setAvailability((prev) => ({
            ...prev,
            [dia.value]: { status: 'error', slots: [], message: err?.message || 'Erro de conexão' },
          }));
        }
      });
    });
  }, [idAtivo, tipo, semanaAtual]);

  function prefetchDay(dia) {
    if (!idAtivo) return;
    const cached = availability[dia.value];
    if (cached && cached.status !== 'error') return;
    const token = fetchTokenRef.current;
    setAvailability((prev) => ({ ...prev, [dia.value]: { status: 'loading', slots: [] } }));
    (async () => {
      try {
        const res = tipo === 'servico'
          ? await buscarDisponibilidade(dia.value, idAtivo)
          : await buscarDisponibilidade(dia.value, null, idAtivo);
        if (token !== fetchTokenRef.current) return;
        setAvailability((prev) => ({
          ...prev,
          [dia.value]: { status: 'ready', slots: res.slotsDisponiveis || [] },
        }));
      } catch (err) {
        if (token !== fetchTokenRef.current) return;
        setAvailability((prev) => ({
          ...prev,
          [dia.value]: { status: 'error', slots: [], message: err?.message || 'Erro de conexão' },
        }));
      }
    })();
  }

  function reset() {
    fetchTokenRef.current += 1;
    setAvailability({});
  }

  return { availability, prefetchDay, reset };
}

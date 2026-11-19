import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { buildForecast } from '@/data/forecast';
import { useAppLocation } from '@/contexts/LocationContext';
import { fetchForecast, type Forecast } from '@/services/weather';

const CACHE_MS = 10 * 60 * 1000;

/** Cache de 10 min por local (chave = coordenadas), para não refazer a chamada a cada pequena navegação. */
const cache = new Map<string, { data: Forecast; at: number }>();

/**
 * Previsão real (Open-Meteo) no local escolhido pela pessoa (tela "Sua localização"),
 * com fallback automático e seguro para o padrão (Sensor 1) enquanto o local salvo carrega.
 */
export function useForecast() {
  const { ready, selected } = useAppLocation();
  const { lat, lon } = selected;
  const cacheKey = `${lat},${lon}`;

  const [data, setData] = useState<Forecast>(() => cache.get(cacheKey)?.data ?? buildForecast());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!ready) {
        setLoading(true);
        return;
      }

      let active = true;
      const cached = cache.get(cacheKey);
      if (cached && Date.now() - cached.at < CACHE_MS) {
        setData(cached.data);
        setError(false);
        setLoading(false);
        return;
      }

      setLoading(true);
      (async () => {
        try {
          const fresh = await fetchForecast(lat, lon);
          if (!active) return;
          cache.set(cacheKey, { data: fresh, at: Date.now() });
          setData(fresh);
          setError(false);
        } catch {
          if (!active) return;
          setData(cached?.data ?? buildForecast());
          setError(true);
        } finally {
          if (active) setLoading(false);
        }
      })();

      return () => {
        active = false;
      };
    }, [ready, cacheKey, lat, lon]),
  );

  return {
    data,
    loading: loading || !ready,
    error,
  };
}

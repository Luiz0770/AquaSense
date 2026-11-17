import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { buildForecast } from '@/data/forecast';
import { fetchForecast, WEATHER_LAT, WEATHER_LON, type Forecast } from '@/services/weather';
import { useUserLocation } from './useUserLocation';

const CACHE_MS = 10 * 60 * 1000;

/** Cache de 10 min por local (chave = coordenadas arredondadas), para não refazer a chamada a cada pequena movimentação. */
const cache = new Map<string, { data: Forecast; at: number }>();

/**
 * Previsão real (Open-Meteo) na localização aproximada do usuário, com fallback
 * automático e seguro para o ponto PT-07 sem permissão, negada ou com erro.
 */
export function useForecast() {
  const userLocation = useUserLocation();
  const usingUser = userLocation.status === 'granted' && userLocation.lat !== null && userLocation.lon !== null;
  const lat = usingUser ? (userLocation.lat as number) : WEATHER_LAT;
  const lon = usingUser ? (userLocation.lon as number) : WEATHER_LON;
  const cacheKey = `${lat},${lon}`;
  const waitingForLocation = userLocation.status === 'loading';

  const [data, setData] = useState<Forecast>(() => cache.get(cacheKey)?.data ?? buildForecast());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (waitingForLocation) {
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
    }, [waitingForLocation, cacheKey, lat, lon]),
  );

  return {
    data,
    loading: loading || waitingForLocation,
    error,
    /** Bairro ou cidade do usuário, para mostrar no lugar do nome do ponto piloto. Null sem permissão/erro. */
    userPlaceName: usingUser ? userLocation.placeName : null,
  };
}

import { useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';

export type UserLocationStatus = 'loading' | 'granted' | 'denied' | 'unavailable';

export interface UserLocationResult {
  status: UserLocationStatus;
  /** Latitude arredondada para 2 casas decimais. */
  lat: number | null;
  /** Longitude arredondada para 2 casas decimais. */
  lon: number | null;
  /** Bairro ou cidade, resolvido no máximo uma vez por coordenada arredondada. */
  placeName: string | null;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Localização aproximada do usuário (foreground only) para a previsão de chuva.
 * Nunca pede permissão em segundo plano. Arredonda a 2 casas antes de usar/expor.
 */
export function useUserLocation(): UserLocationResult {
  const [status, setStatus] = useState<UserLocationStatus>('loading');
  const [lat, setLat] = useState<number | null>(null);
  const [lon, setLon] = useState<number | null>(null);
  const [placeName, setPlaceName] = useState<string | null>(null);
  const lastGeocodedKey = useRef<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { granted } = await Location.requestForegroundPermissionsAsync();
        if (!active) return;
        if (!granted) {
          setStatus('denied');
          return;
        }

        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        if (!active) return;

        const roundedLat = round2(pos.coords.latitude);
        const roundedLon = round2(pos.coords.longitude);
        setLat(roundedLat);
        setLon(roundedLon);
        setStatus('granted');

        const key = `${roundedLat},${roundedLon}`;
        if (lastGeocodedKey.current !== key) {
          lastGeocodedKey.current = key;
          try {
            const results = await Location.reverseGeocodeAsync({ latitude: roundedLat, longitude: roundedLon });
            if (!active) return;
            const place = results[0];
            const name = place?.district || place?.city || null;
            setPlaceName(name);
          } catch {
            if (active) setPlaceName(null);
          }
        }
      } catch {
        if (active) setStatus('unavailable');
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  return { status, lat, lon, placeName };
}

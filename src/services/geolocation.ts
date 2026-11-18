import * as Location from 'expo-location';

export interface LocationFix {
  /** Latitude arredondada para 2 casas decimais. */
  lat: number;
  /** Longitude arredondada para 2 casas decimais. */
  lon: number;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Pede permissão em primeiro plano e lê a posição atual (precisão balanceada),
 * arredondada a 2 casas antes de usar/expor. Lança erro se a permissão for negada
 * ou a leitura falhar; nunca pede permissão em segundo plano.
 */
export async function getCurrentLocationFix(): Promise<LocationFix> {
  const { granted } = await Location.requestForegroundPermissionsAsync();
  if (!granted) throw Object.assign(new Error('Permissão de localização negada.'), { code: 'permission-denied' });

  const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
  return { lat: round2(pos.coords.latitude), lon: round2(pos.coords.longitude) };
}

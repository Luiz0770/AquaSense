import { WEATHER_LAT, WEATHER_LON } from '@/services/weather';
import type { SelectedLocation } from '@/types';

/**
 * Local padrão da previsão: o Sensor 1 (o id é o do sensor, para a tela Início mostrar o nível dele).
 * Vale só até a pessoa escolher outro local na tela "Sua localização".
 */
export const DEFAULT_LOCATION: SelectedLocation = {
  id: 'sensor-1',
  name: 'Sensor 1',
  subtitle: 'Ponto monitorado',
  lat: WEATHER_LAT,
  lon: WEATHER_LON,
};

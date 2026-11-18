import { WEATHER_LAT, WEATHER_LON } from '@/services/weather';
import type { SelectedLocation } from '@/types';

/**
 * Local padrão da previsão: o ponto do sensor PT-07 (Ipiranga/SP).
 * Vale só até a pessoa escolher outro local na tela "Sua localização".
 */
export const DEFAULT_LOCATION: SelectedLocation = {
  id: 'pt-07',
  name: 'PT-07 · Ipiranga',
  subtitle: 'Ponto monitorado',
  lat: WEATHER_LAT,
  lon: WEATHER_LON,
};

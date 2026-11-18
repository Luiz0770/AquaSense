import { WEATHER_LAT, WEATHER_LON } from '@/services/weather';

export interface LocationOption {
  id: string;
  name: string;
  subtitle: string;
  lat: number;
  lon: number;
}

/** Pontos de monitoramento, com coordenadas fixas de demonstração (PT-07 usa o fallback do serviço de tempo). */
export const MONITORED_POINTS: LocationOption[] = [
  { id: 'pt-07', name: 'PT-07 · Ipiranga', subtitle: 'Ponto monitorado', lat: WEATHER_LAT, lon: WEATHER_LON },
  { id: 'pt-11', name: 'PT-11 · Av. do Estado', subtitle: 'Ponto monitorado', lat: -23.5774, lon: -46.6132 },
  { id: 'pt-03', name: 'PT-03 · Rua Tabor', subtitle: 'Ponto monitorado', lat: -23.5932, lon: -46.6027 },
];

/** Bairros de São Paulo, com coordenadas fixas de demonstração. */
export const BAIRROS: LocationOption[] = [
  { id: 'ipiranga', name: 'Ipiranga', subtitle: 'São Paulo, SP', lat: -23.589, lon: -46.6113 },
  { id: 'vila-monumento', name: 'Vila Monumento', subtitle: 'São Paulo, SP', lat: -23.5812, lon: -46.6126 },
  { id: 'sacoma', name: 'Sacomã', subtitle: 'São Paulo, SP', lat: -23.6107, lon: -46.6151 },
  { id: 'cambuci', name: 'Cambuci', subtitle: 'São Paulo, SP', lat: -23.57, lon: -46.6213 },
  { id: 'mooca', name: 'Mooca', subtitle: 'São Paulo, SP', lat: -23.561, lon: -46.6007 },
  { id: 'vila-mariana', name: 'Vila Mariana', subtitle: 'São Paulo, SP', lat: -23.589, lon: -46.6345 },
];

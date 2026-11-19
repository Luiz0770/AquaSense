import { DIAS, type DayForecast, type ForecastIcon, type HourForecast } from '@/data/forecast';

/** Coordenadas padrão do Sensor 1 (Ipiranga/SP), ajustável por EXPO_PUBLIC_WEATHER_LAT/LON sem alterar código. */
export const WEATHER_LAT = Number(process.env.EXPO_PUBLIC_WEATHER_LAT) || -23.587;
export const WEATHER_LON = Number(process.env.EXPO_PUBLIC_WEATHER_LON) || -46.61;

function forecastUrl(lat: number, lon: number): string {
  return (
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&timezone=America/Sao_Paulo&hourly=precipitation_probability,precipitation,weather_code` +
    `&daily=precipitation_probability_max,precipitation_sum,temperature_2m_max,temperature_2m_min,weather_code` +
    `&forecast_days=5`
  );
}

const FETCH_TIMEOUT_MS = 8000;
const HOURS_AHEAD = 8;
const DAYS_AHEAD = 5;

interface OpenMeteoResponse {
  hourly: {
    time: string[];
    precipitation_probability: number[];
    precipitation: number[];
    weather_code: number[];
  };
  daily: {
    time: string[];
    precipitation_probability_max: number[];
    precipitation_sum: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    weather_code: number[];
  };
}

export interface Forecast {
  hours: HourForecast[];
  days: DayForecast[];
}

/** Códigos WMO (weather_code) usados pela Open-Meteo. */
function iconFromWeatherCode(code: number): ForecastIcon {
  if (code >= 95) return 'thunderstorm';
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return 'rainy';
  if (code === 3) return 'cloud';
  if (code === 1 || code === 2) return 'partly_cloudy_day';
  if (code === 0) return 'wb_sunny';
  return 'cloud';
}

async function fetchJson(lat: number, lon: number): Promise<OpenMeteoResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(forecastUrl(lat, lon), { signal: controller.signal });
    if (!res.ok) throw new Error(`Open-Meteo respondeu ${res.status}`);
    return (await res.json()) as OpenMeteoResponse;
  } finally {
    clearTimeout(timeout);
  }
}

/** Busca a previsão real na Open-Meteo e converte para o formato que o card de Início consome. */
export async function fetchForecast(lat: number = WEATHER_LAT, lon: number = WEATHER_LON): Promise<Forecast> {
  const data = await fetchJson(lat, lon);
  if (!data.hourly?.time?.length || !data.daily?.time?.length) {
    throw new Error('Resposta da Open-Meteo sem dados de previsão');
  }

  const now = Date.now();
  const startIdx = data.hourly.time.findIndex((t) => new Date(t).getTime() > now);
  const from = startIdx === -1 ? 0 : startIdx;

  const hours: HourForecast[] = data.hourly.time.slice(from, from + HOURS_AHEAD).map((t, i) => {
    const idx = from + i;
    return {
      hora: new Date(t).getHours(),
      prob: Math.round(data.hourly.precipitation_probability[idx] ?? 0),
      mm: Math.round((data.hourly.precipitation[idx] ?? 0) * 10) / 10,
      icon: iconFromWeatherCode(data.hourly.weather_code[idx] ?? 0),
    };
  });

  const days: DayForecast[] = data.daily.time.slice(0, DAYS_AHEAD).map((t, i) => {
    const d = new Date(t);
    return {
      dia: i === 0 ? 'Hoje' : i === 1 ? 'Amanhã' : DIAS[d.getDay()],
      prob: Math.round(data.daily.precipitation_probability_max[i] ?? 0),
      mm: Math.round((data.daily.precipitation_sum[i] ?? 0) * 10) / 10,
      min: Math.round(data.daily.temperature_2m_min[i] ?? 0),
      max: Math.round(data.daily.temperature_2m_max[i] ?? 0),
      icon: iconFromWeatherCode(data.daily.weather_code[i] ?? 0),
    };
  });

  return { hours, days };
}

export interface GeocodeResult {
  lat: number;
  lon: number;
}

function geocodeUrl(query: string): string {
  return `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=pt&format=json`;
}

/** Geocodifica um endereço digitado (bairro ou rua) pela Open-Meteo. Null quando não encontra. */
export async function geocodeAddress(query: string): Promise<GeocodeResult | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(geocodeUrl(query), { signal: controller.signal });
    if (!res.ok) return null;
    const data = (await res.json()) as { results?: { latitude: number; longitude: number }[] };
    const first = data.results?.[0];
    if (!first) return null;
    return { lat: first.latitude, lon: first.longitude };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Previsão de chuva de DEMONSTRAÇÃO (tela Início). Quando houver uma API de tempo,
 * troque só este arquivo mantendo o formato.
 */

export interface HourForecast {
  hora: number;
  /** Chance de chuva (%). */
  prob: number;
  mm: number;
  /** Vem pronto quando os dados são de uma API; sem isso o card deriva de prob/mm. */
  icon?: ForecastIcon;
}

export interface DayForecast {
  dia: string;
  prob: number;
  mm: number;
  min: number;
  max: number;
  icon?: ForecastIcon;
}

export const DIAS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

export function buildForecast(now: Date = new Date()): { hours: HourForecast[]; days: DayForecast[] } {
  const h0 = now.getHours();
  const hp = [20, 35, 60, 80, 85, 70, 40, 20];
  const hm = [0, 0.4, 2.5, 6, 8, 4, 1, 0];
  const dp = [85, 60, 30, 15, 70];
  const dm = [18, 7, 1, 0, 12];
  const tmin = [18, 17, 19, 20, 18];
  const tmax = [24, 23, 27, 29, 25];
  return {
    hours: hp.map((prob, i) => ({ hora: (h0 + i + 1) % 24, prob, mm: hm[i] })),
    days: dp.map((prob, i) => ({
      dia: i === 0 ? 'Hoje' : i === 1 ? 'Amanhã' : DIAS[(now.getDay() + i) % 7],
      prob,
      mm: dm[i],
      min: tmin[i],
      max: tmax[i],
    })),
  };
}

export type ForecastIcon = 'wb_sunny' | 'partly_cloudy_day' | 'cloud' | 'thunderstorm' | 'rainy';

export function forecastIcon(prob: number, mm: number): ForecastIcon {
  if (prob < 30) return 'partly_cloudy_day';
  if (prob < 60) return 'cloud';
  return mm >= 6 ? 'thunderstorm' : 'rainy';
}

/** Chuva medida (mm/h) a partir da qual o indicador de chance chega a 100%. */
const LIVE_RAIN_FULL_MM = 20;

/**
 * Primeiro quadradinho da previsão ("Em 1 h") quando a fonte é o sensor ESP32 (Wokwi):
 * no lugar do valor da API, usa a chuva medida agora. A "chance" é derivada dos mm/h
 * (0 mm/h = 0%, 20 mm/h ou mais = 100%), para a barra e o ícone acompanharem o sensor.
 */
export function liveHourFromRain(base: HourForecast, chuvaMm: number): HourForecast {
  const mm = Math.max(0, Math.round(chuvaMm * 10) / 10);
  const prob = Math.min(100, Math.round((mm / LIVE_RAIN_FULL_MM) * 100));
  const icon: ForecastIcon = mm <= 0 ? 'partly_cloudy_day' : mm >= 6 ? 'thunderstorm' : 'rainy';
  return { hora: base.hora, prob, mm, icon };
}

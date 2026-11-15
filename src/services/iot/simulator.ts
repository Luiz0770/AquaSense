import type { Reading, Scenario } from '@/types';
import { makeId } from '@/utils/format';
import { pilotPoint } from '@/data/pilotPoint';

interface Profile {
  /** Nível (cm) para onde a água tende. */
  target: number;
  /** Fração da distância até o alvo percorrida a cada leitura. */
  rate: number;
  /** Variação aleatória do nível (± cm). */
  noise: number;
  rainMin: number;
  rainMax: number;
}

export const PROFILES: Record<Scenario, Profile> = {
  sem_chuva: { target: 6, rate: 0.25, noise: 1, rainMin: 0, rainMax: 1 },
  moderada: { target: 32, rate: 0.35, noise: 2, rainMin: 5, rainMax: 14 },
  forte: { target: 95, rate: 0.28, noise: 3, rainMin: 25, rainMax: 48 },
};

export const SCENARIO_LABEL: Record<Scenario, string> = {
  sem_chuva: 'Sem chuva',
  moderada: 'Moderada',
  forte: 'Forte',
};

export const SCENARIO_HINT: Record<Scenario, string> = {
  sem_chuva: 'Sem chuva: o nível desce até a faixa Normal.',
  moderada: 'Chuva moderada: o nível oscila perto de Atenção.',
  forte: 'Chuva forte: o nível sobe até Alerta e Crítico.',
};

export const SCENARIOS: Scenario[] = ['sem_chuva', 'moderada', 'forte'];

export const READING_INTERVAL_MS = 5000;

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

export function initialReading(now: Date = new Date()): Reading {
  return {
    id: makeId('r'),
    sensorId: pilotPoint.sensorId,
    nivelCm: 12,
    chuvaMm: 2,
    timestamp: now.toISOString(),
  };
}

/**
 * Gera a próxima leitura simulada, no mesmo formato que o ESP32 vai enviar:
 * { sensorId, nivelCm, chuvaMm, timestamp }.
 * `rng` pode ser trocado nos testes.
 */
export function nextReading(
  prev: Reading,
  scenario: Scenario,
  now: Date = new Date(),
  rng: () => number = Math.random,
): Reading {
  const p = PROFILES[scenario];
  const drift = (p.target - prev.nivelCm) * p.rate;
  const jitter = (rng() - 0.5) * 2 * p.noise;
  const nivelCm = Math.round(clamp(prev.nivelCm + drift + jitter, 0, pilotPoint.maxCm));
  const chuvaMm = Math.round(p.rainMin + rng() * (p.rainMax - p.rainMin));
  return {
    id: makeId('r'),
    sensorId: prev.sensorId,
    nivelCm,
    chuvaMm,
    timestamp: now.toISOString(),
  };
}

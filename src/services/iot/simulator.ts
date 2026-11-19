import type { Level, Reading, Scenario } from '@/types';
import { makeId } from '@/utils/format';
import { pilotPoint } from '@/data/pilotPoint';
import { LIMITS } from './thresholds';

/**
 * Simulador do nível da água.
 *
 * O nível não sorteia mais um valor novo a cada leitura: ele caminha devagar até um ALVO e fica
 * parado ali, com uma variação de poucos milímetros. Por isso a faixa (Normal, Atenção, Alerta,
 * Crítico) só muda quando o agente troca o cenário na Simulação ou quando o ESP32 (Wokwi/Node-RED)
 * manda outro nível.
 *
 * - 'real': usa a chuva medida agora pela Open-Meteo no local dos sensores. Sem chuva, o nível fica
 *   na água parada do sensor (`base`); com chuva sobe só um pouco, e nunca sai da faixa Normal.
 * - Os outros cenários fixam o sensor numa faixa, sempre longe das bordas (20, 40 e 70 cm), para a
 *   variação pequena não ficar trocando de faixa.
 */

interface Profile {
  /** Faixa em que o nível fica parado. */
  level: Level;
  /** Intervalo de nível (cm) dentro da faixa; o `fator` do sensor escolhe a posição. */
  min: number;
  max: number;
  /** Chuva típica do cenário (mm/h). No 'real', vem da Open-Meteo. */
  rainMm: number;
}

export const PROFILES: Record<Scenario, Profile> = {
  real: { level: 'normal', min: 0, max: 16, rainMm: 0 },
  sem_chuva: { level: 'normal', min: 3, max: 10, rainMm: 0 },
  moderada: { level: 'atencao', min: 24, max: 35, rainMm: 8 },
  forte: { level: 'alerta', min: 46, max: 62, rainMm: 22 },
  extrema: { level: 'critico', min: 76, max: 92, rainMm: 42 },
};

export const SCENARIO_LABEL: Record<Scenario, string> = {
  real: 'Clima real',
  sem_chuva: 'Sem chuva',
  moderada: 'Moderada',
  forte: 'Forte',
  extrema: 'Extrema',
};

export const SCENARIO_HINT: Record<Scenario, string> = {
  real: 'Clima real: usa a chuva de agora da Open-Meteo. O nível sobe só um pouco com a chuva e fica sempre em Normal.',
  sem_chuva: 'Sem chuva: o nível desce devagar e fica parado em Normal.',
  moderada: 'Chuva moderada: o nível sobe devagar e fica parado em Atenção.',
  forte: 'Chuva forte: o nível sobe devagar e fica parado em Alerta.',
  extrema: 'Chuva extrema: o nível sobe devagar e fica parado em Crítico.',
};

export const SCENARIOS: Scenario[] = ['real', 'sem_chuva', 'moderada', 'forte', 'extrema'];

export const READING_INTERVAL_MS = 5000;

/** Fração do caminho até o alvo percorrida a cada leitura (5 s): chega em cerca de 1 min e 15 s. */
export const APPROACH_RATE = 0.15;
/** Variação da leitura parada (± cm), como a de um ultrassônico de verdade. */
export const NOISE_CM = 0.2;
/** Quanto o nível sobe por mm/h de chuva no cenário 'real' (e no máximo quanto). */
const REAL_CM_PER_MM = 0.5;
const REAL_MAX_RISE_CM = 5;
/** Margem mínima até a borda da faixa, para o ruído nunca trocar a faixa. */
const EDGE_MARGIN_CM = 3;

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
const r1 = (n: number) => Math.round(n * 10) / 10;

export function initialReading(now: Date = new Date(), sensorId: string = pilotPoint.sensorId, nivelCm = 9): Reading {
  return {
    id: makeId('r'),
    sensorId,
    nivelCm,
    chuvaMm: 0,
    timestamp: now.toISOString(),
  };
}

/**
 * Nível (cm) em que o sensor fica parado neste cenário.
 * `fator` (0,75 a 1,25) põe o sensor mais embaixo ou mais em cima da faixa, sem sair dela.
 */
export function targetLevel(scenario: Scenario, opts: { fator?: number; base?: number; apiRainMm?: number | null } = {}): number {
  const fator = opts.fator ?? 1;
  const p = PROFILES[scenario];
  if (scenario === 'real') {
    const base = clamp(opts.base ?? 9, 0, LIMITS.atencao - EDGE_MARGIN_CM);
    const rise = Math.min(REAL_MAX_RISE_CM, Math.max(0, opts.apiRainMm ?? 0) * REAL_CM_PER_MM) * fator;
    return r1(clamp(base + rise, 0, LIMITS.atencao - EDGE_MARGIN_CM - 1));
  }
  const pos = clamp(0.5 + (fator - 1) * 1.2, 0.15, 0.85);
  return r1(p.min + (p.max - p.min) * pos);
}

/**
 * Chuva da região (é uma só para os 3 sensores): a maior entre a da Open-Meteo (cenário 'real')
 * e a dos cenários escolhidos pelo agente, com variação de ±5%.
 */
export function regionalRain(scenarios: Scenario[], apiRainMm: number | null = null, rng: () => number = Math.random): number {
  const api = Math.max(0, apiRainMm ?? 0);
  let rain = scenarios.includes('real') ? api : 0;
  for (const s of scenarios) {
    if (s === 'real') continue;
    rain = Math.max(rain, PROFILES[s].rainMm * (0.95 + rng() * 0.1));
  }
  return r1(rain);
}

/**
 * Próxima leitura simulada, no mesmo formato que o ESP32 envia: { sensorId, nivelCm, chuvaMm, timestamp }.
 * O nível anda {@link APPROACH_RATE} do caminho até o alvo e varia no máximo {@link NOISE_CM}.
 * `rng` pode ser trocado nos testes.
 */
export function nextReading(
  prev: Reading,
  scenario: Scenario,
  now: Date = new Date(),
  rng: () => number = Math.random,
  opts: { fator?: number; base?: number; chuvaMm?: number; apiRainMm?: number | null } = {},
): Reading {
  const target = targetLevel(scenario, opts);
  const step = (target - prev.nivelCm) * APPROACH_RATE;
  const jitter = (rng() - 0.5) * 2 * NOISE_CM;
  const nivelCm = r1(clamp(prev.nivelCm + step + jitter, 0, pilotPoint.maxCm));
  const chuvaMm = opts.chuvaMm ?? regionalRain([scenario], opts.apiRainMm ?? null, rng);
  return {
    id: makeId('r'),
    sensorId: prev.sensorId,
    nivelCm,
    chuvaMm,
    timestamp: now.toISOString(),
  };
}

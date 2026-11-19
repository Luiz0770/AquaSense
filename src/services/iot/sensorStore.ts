import type { Reading, Scenario } from '@/types';
import { SENSORS, type SensorDef } from '@/data/sensors';
import { initialReading, SCENARIOS } from './simulator';

/** Estado de um sensor guardado no aparelho: leituras (mais nova primeiro), cenário e se a simulação está ligada. */
export interface SensorState {
  readings: Reading[];
  scenario: Scenario;
  running: boolean;
}

export type SensorStore = Record<string, SensorState>;

export const MAX_READINGS_PER_SENSOR = 100;

/**
 * Versão do formato salvo. A 2 é a do simulador estável (nível parado numa faixa, chuva da Open-Meteo).
 * Dados de versões anteriores vinham do simulador antigo, que oscilava muito: o app começa do zero.
 */
export const SENSOR_STORE_VERSION = 2;

export interface SavedSensorStore {
  v: number;
  sensors: SensorStore;
}

export function freshSensorState(def: SensorDef, now: Date = new Date()): SensorState {
  return { readings: [initialReading(now, def.id, def.base)], scenario: def.cenario, running: true };
}

function isReading(r: unknown): r is Reading {
  if (!r || typeof r !== 'object') return false;
  const o = r as Record<string, unknown>;
  return typeof o.id === 'string' && typeof o.nivelCm === 'number' && typeof o.chuvaMm === 'number' && typeof o.timestamp === 'string';
}

/**
 * Monta o estado dos sensores a partir do que está no aparelho (`{ v: 2, sensors: {...} }`).
 * Sensores sem dados, dado estranho ou de versão antiga começam do zero (nível parado, cenário "Clima real").
 */
export function normalizeSensorStore(raw: unknown, now: Date = new Date()): SensorStore {
  const saved = raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as Partial<SavedSensorStore>) : null;
  const src = saved?.v === SENSOR_STORE_VERSION && saved.sensors && typeof saved.sensors === 'object' ? (saved.sensors as Record<string, unknown>) : null;
  const out: SensorStore = {};
  for (const def of SENSORS) {
    let st: SensorState = freshSensorState(def, now);
    const one = src?.[def.id] as Record<string, unknown> | undefined;
    if (one && typeof one === 'object') {
      const readings = Array.isArray(one.readings) ? one.readings.filter(isReading) : [];
      st = {
        readings: readings.length ? readings.slice(0, MAX_READINGS_PER_SENSOR).map((r) => ({ ...r, sensorId: def.id })) : st.readings,
        scenario: SCENARIOS.includes(one.scenario as Scenario) ? (one.scenario as Scenario) : def.cenario,
        running: typeof one.running === 'boolean' ? one.running : true,
      };
    }
    out[def.id] = st;
  }
  return out;
}

export function toSaved(store: SensorStore): SavedSensorStore {
  return { v: SENSOR_STORE_VERSION, sensors: store };
}

/** Põe a leitura no topo da lista do sensor, sem passar do limite. */
export function withReading(store: SensorStore, id: string, reading: Reading): SensorStore {
  const st = store[id];
  if (!st) return store;
  return { ...store, [id]: { ...st, readings: [reading, ...st.readings].slice(0, MAX_READINGS_PER_SENSOR) } };
}

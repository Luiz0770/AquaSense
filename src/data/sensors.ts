import type { Scenario } from '@/types';

/**
 * Sensores ultrassônicos da rede (os mesmos do circuito no Wokwi, pasta wokwi/).
 * Para ter mais sensores, basta acrescentar itens aqui: as telas usam listas, filtros e rolagem,
 * e o app passa a aceitar as leituras MQTT com o novo id.
 */
export interface SensorDef {
  /** Id usado no MQTT ("sensorId") e no armazenamento. */
  id: string;
  /** Nome mostrado nas telas. */
  nome: string;
  /** Número no radar. */
  num: number;
  /** Ligação no ESP32 (mostrada na tela Sensor). */
  pinos: string;
  /** Posição no radar do painel, em % do tamanho. */
  x: number;
  y: number;
  /** Quanto este ponto alaga em relação aos outros (1 = médio): muda a posição dentro da faixa, nunca a faixa. */
  fator: number;
  /** Nível de água parada sem chuva, em cm (sempre na faixa Normal). */
  base: number;
  /** Cenário inicial da simulação. */
  cenario: Scenario;
}

export const SENSORS: SensorDef[] = [
  { id: 'sensor-1', nome: 'Sensor 1', num: 1, pinos: 'HC-SR04 · TRIG 5 / ECHO 18', x: 58, y: 34, fator: 1, base: 9, cenario: 'real' },
  { id: 'sensor-2', nome: 'Sensor 2', num: 2, pinos: 'HC-SR04 · TRIG 19 / ECHO 21', x: 27, y: 60, fator: 1.25, base: 12, cenario: 'real' },
  { id: 'sensor-3', nome: 'Sensor 3', num: 3, pinos: 'HC-SR04 · TRIG 22 / ECHO 23', x: 70, y: 70, fator: 0.75, base: 6, cenario: 'real' },
];

export const DEFAULT_SENSOR_ID = SENSORS[0].id;

/**
 * Ids antigos que ainda podem chegar: o firmware de 1 sensor ("ESP32-01") e a versão de
 * 3 sensores com códigos PT-xx. Todos viram os ids atuais.
 */
const LEGACY_IDS: Record<string, string> = {
  'esp32-01': 'sensor-1',
  'pt-07': 'sensor-1',
  'pt-11': 'sensor-2',
  'pt-03': 'sensor-3',
};

/** Id atual de um sensor a partir do que veio na mensagem; null se não for de um sensor conhecido. */
export function resolveSensorId(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const key = raw.trim().toLowerCase();
  if (SENSORS.some((s) => s.id === key)) return key;
  return LEGACY_IDS[key] ?? null;
}

export function sensorById(id: string | null | undefined): SensorDef {
  return SENSORS.find((s) => s.id === id) ?? SENSORS[0];
}

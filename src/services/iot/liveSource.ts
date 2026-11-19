import type { Reading } from '@/types';
import { DEFAULT_SENSOR_ID, resolveSensorId } from '@/data/sensors';
import { subscribeMqtt, type MqttStatus } from './mqttLite';

/**
 * Fonte "ao vivo": o ESP32 do Wokwi (pasta wokwi/) publica a leitura num broker MQTT
 * público e o app assina o mesmo tópico por WebSocket.
 * O broker é aberto (sem login): por isso toda mensagem é validada antes de entrar no app.
 */
export const LIVE_SOURCE = {
  url: 'wss://broker.hivemq.com:8884/mqtt',
  topic: 'fiap2026/aquasense',
  /** Sem leitura do ESP32 por este tempo, o simulador do app volta a gerar os dados. */
  timeoutMs: 15_000,
  /**
   * Keep alive do MQTT. 60 s (em vez de 30) porque, numa aba do navegador em
   * segundo plano, os timers podem rodar só uma vez por minuto; com 30 s o broker
   * derrubava a conexão antes do próximo PINGREQ.
   */
  keepAliveSec: 60,
} as const;

export type LiveReading = Pick<Reading, 'sensorId' | 'nivelCm' | 'chuvaMm'>;

const num = (v: unknown, min: number, max: number): number | null =>
  typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max ? Math.round(v * 10) / 10 : null;

/**
 * Aceita só o JSON esperado do ESP32, uma mensagem por sensor:
 * { "sensorId": "sensor-2", "nivelCm": 12.3, "chuvaMm": 4.5, ... }.
 * Sem sensorId (firmware antigo, de 1 sensor) vale como Sensor 1; ids antigos (ESP32-01, PT-xx) são convertidos.
 * Sensor desconhecido ou qualquer outra coisa (texto, faixa absurda, campo faltando) é descartado.
 */
export function parseLivePayload(text: string): LiveReading | null {
  if (text.length > 1024) return null;
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return null;
  }
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
  const o = data as Record<string, unknown>;
  const nivelCm = num(o.nivelCm, 0, 400);
  const chuvaMm = num(o.chuvaMm, 0, 300);
  if (nivelCm === null || chuvaMm === null) return null;
  const sensorId = o.sensorId === undefined ? DEFAULT_SENSOR_ID : resolveSensorId(o.sensorId);
  if (!sensorId) return null;
  return { sensorId, nivelCm, chuvaMm };
}

/** Liga a assinatura do tópico. Devolve a função que desliga. */
export function connectLiveSource(handlers: {
  onReading: (r: LiveReading) => void;
  onStatus: (s: MqttStatus) => void;
}): () => void {
  const sub = subscribeMqtt({
    url: LIVE_SOURCE.url,
    topic: LIVE_SOURCE.topic,
    keepAliveSec: LIVE_SOURCE.keepAliveSec,
    onStatus: handlers.onStatus,
    onMessage: (_topic, payload) => {
      const r = parseLivePayload(payload);
      if (r) handlers.onReading(r);
    },
  });
  return () => sub.close();
}

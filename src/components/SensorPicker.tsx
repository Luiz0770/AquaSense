import type { SensorView } from '@/contexts/MonitoringContext';

/** Texto curto do estado do sensor: fonte e se a simulação está ligada. */
export function sensorState(s: SensorView): string {
  if (s.source === 'esp32') return 'Ao vivo (ESP32)';
  return s.running ? 'Simulado' : 'Pausado';
}

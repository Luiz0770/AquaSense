import { useAppLocation } from '@/contexts/LocationContext';
import { useMonitoring, type SensorView } from '@/contexts/MonitoringContext';
import { DEFAULT_SENSOR_ID, resolveSensorId } from '@/data/sensors';

/**
 * Sensor da tela Início (cidadão): o sensor escolhido em "Sua localização", se for um deles;
 * para qualquer outro local, o Sensor 1.
 */
export function useHomeSensor(): SensorView {
  const { sensorById } = useMonitoring();
  const { selected } = useAppLocation();
  return sensorById(resolveSensorId(selected.id) ?? DEFAULT_SENSOR_ID);
}

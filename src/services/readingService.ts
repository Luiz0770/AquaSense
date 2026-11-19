import { getItem, setItem, StorageKeys } from './storage';
import { normalizeSensorStore, toSaved, type SensorStore } from './iot/sensorStore';

export { MAX_READINGS_PER_SENSOR as MAX_READINGS } from './iot/sensorStore';

/** Leituras, cenário e pausa de cada sensor. Dados do simulador antigo são descartados (veja sensorStore). */
export async function loadSensorStore(): Promise<SensorStore> {
  return normalizeSensorStore(await getItem<unknown>(StorageKeys.sensors, null));
}

export function saveSensorStore(store: SensorStore): Promise<void> {
  return setItem(StorageKeys.sensors, toSaved(store));
}

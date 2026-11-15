import type { Reading, Scenario } from '@/types';
import { getItem, setItem, StorageKeys } from './storage';
import { initialReading } from './iot/simulator';

export const MAX_READINGS = 100;

/** Leituras guardadas, da mais nova para a mais antiga. */
export async function loadReadings(): Promise<Reading[]> {
  const list = await getItem<Reading[]>(StorageKeys.readings, []);
  return list.length > 0 ? list : [initialReading()];
}

export async function saveReadings(readings: Reading[]): Promise<void> {
  await setItem(StorageKeys.readings, readings.slice(0, MAX_READINGS));
}

export function loadScenario(): Promise<Scenario> {
  return getItem<Scenario>(StorageKeys.scenario, 'moderada');
}

export function saveScenario(s: Scenario): Promise<void> {
  return setItem(StorageKeys.scenario, s);
}

export function loadRunning(): Promise<boolean> {
  return getItem<boolean>(StorageKeys.running, true);
}

export function saveRunning(r: boolean): Promise<void> {
  return setItem(StorageKeys.running, r);
}

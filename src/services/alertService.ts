import type { AlertEvent } from '@/types';
import { getItem, setItem, StorageKeys } from './storage';

export const MAX_ALERTS = 50;

export function loadAlerts(): Promise<AlertEvent[]> {
  return getItem<AlertEvent[]>(StorageKeys.alerts, []);
}

export function saveAlerts(alerts: AlertEvent[]): Promise<void> {
  return setItem(StorageKeys.alerts, alerts.slice(0, MAX_ALERTS));
}

export { buildAlert } from './iot/alerts';

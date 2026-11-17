import type { Settings } from '@/types';
import { getItem, setItem, StorageKeys } from './storage';

export const defaultSettings: Settings = {
  fontSize: 'normal',
  highContrast: false,
  reduceMotion: false,
  noticeDismissed: false,
};

export async function loadSettings(): Promise<Settings> {
  const saved = await getItem<Partial<Settings>>(StorageKeys.settings, {});
  return { ...defaultSettings, ...saved };
}

export function saveSettings(s: Settings): Promise<void> {
  return setItem(StorageKeys.settings, s);
}

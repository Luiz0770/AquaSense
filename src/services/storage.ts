import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Única porta de entrada para o AsyncStorage. Nenhuma tela ou contexto
 * chama o AsyncStorage direto: tudo passa por aqui e pelos serviços.
 */
const PREFIX = '@aquasense:';

export const StorageKeys = {
  users: 'users',
  session: 'session',
  readings: 'readings',
  /** Leituras, cenário e pausa de cada sensor (substitui readings/scenario/running). */
  sensors: 'sensors',
  alerts: 'alerts',
  reports: 'reports',
  reportsSeeded: 'reports-seeded',
  scenario: 'scenario',
  running: 'running',
  settings: 'settings',
  selectedLocation: 'selected-location',
  lastGpsFix: 'last-gps-fix',
  recentSearches: 'recent-searches',
  locationAsked: 'location-asked',
} as const;

export async function getItem<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(PREFIX + key);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

export async function setItem<T>(key: string, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // Falha de gravação não deve derrubar o app; o estado em memória continua valendo.
  }
}

export async function removeItem(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(PREFIX + key);
  } catch {
    // ignora
  }
}

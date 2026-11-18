import type { GpsFix, SelectedLocation } from '@/types';
import { sanitizeRecentSearches } from '@/utils/recentSearches';
import { getItem, setItem, StorageKeys } from './storage';

/** Último local escolhido pelo usuário (null se ainda não escolheu nenhum). */
export function loadSelectedLocation(): Promise<SelectedLocation | null> {
  return getItem<SelectedLocation | null>(StorageKeys.selectedLocation, null);
}

export function saveSelectedLocation(loc: SelectedLocation): Promise<void> {
  return setItem(StorageKeys.selectedLocation, loc);
}

/** Última posição por GPS (coordenadas arredondadas), usada para ordenar por proximidade. */
export function loadLastGpsFix(): Promise<GpsFix | null> {
  return getItem<GpsFix | null>(StorageKeys.lastGpsFix, null);
}

export function saveLastGpsFix(fix: GpsFix): Promise<void> {
  return setItem(StorageKeys.lastGpsFix, fix);
}

/** Últimas buscas por endereço (da mais nova para a mais antiga), guardadas só neste aparelho. */
export async function loadRecentSearches(): Promise<SelectedLocation[]> {
  return sanitizeRecentSearches(await getItem<unknown>(StorageKeys.recentSearches, []));
}

export function saveRecentSearches(list: SelectedLocation[]): Promise<void> {
  return setItem(StorageKeys.recentSearches, list);
}

import type { SelectedLocation } from '@/types';
import { normalizeText } from './format';

/** Quantas buscas recentes ficam guardadas. */
export const MAX_RECENT_SEARCHES = 5;

/** Põe a busca no topo da lista; se ela já existia (mesmo nome, sem acento nem caixa), só sobe para o topo. */
export function addRecentSearch(list: SelectedLocation[], loc: SelectedLocation): SelectedLocation[] {
  const key = normalizeText(loc.name);
  return [loc, ...list.filter((x) => normalizeText(x.name) !== key)].slice(0, MAX_RECENT_SEARCHES);
}

/** Aceita só o que parece uma busca válida (o AsyncStorage pode ter dado antigo ou corrompido). */
export function sanitizeRecentSearches(raw: unknown): SelectedLocation[] {
  if (!Array.isArray(raw)) return [];
  const out: SelectedLocation[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const { id, name, subtitle, lat, lon } = item as Record<string, unknown>;
    if (typeof id !== 'string' || typeof name !== 'string' || typeof subtitle !== 'string') continue;
    if (!name.trim()) continue;
    if (typeof lat !== 'number' || typeof lon !== 'number' || !Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    if (Math.abs(lat) > 90 || Math.abs(lon) > 180) continue;
    out.push({ id, name: name.trim().slice(0, 80), subtitle, lat, lon });
  }
  return out.slice(0, MAX_RECENT_SEARCHES);
}

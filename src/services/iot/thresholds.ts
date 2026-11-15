import type { Level } from '@/types';

/**
 * Limiares de DEMONSTRAÇÃO em centímetros. Não são valores oficiais.
 * Combine com quem monta o circuito no Wokwi e troque aqui.
 */
export const LIMITS = { atencao: 20, alerta: 40, critico: 70 } as const;

export const LEVEL_ORDER: Level[] = ['normal', 'atencao', 'alerta', 'critico'];

export function levelFor(nivelCm: number): Level {
  if (nivelCm >= LIMITS.critico) return 'critico';
  if (nivelCm >= LIMITS.alerta) return 'alerta';
  if (nivelCm >= LIMITS.atencao) return 'atencao';
  return 'normal';
}

export function severity(level: Level): number {
  return LEVEL_ORDER.indexOf(level);
}

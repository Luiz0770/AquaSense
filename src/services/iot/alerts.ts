import type { AlertEvent, Level, Reading } from '@/types';
import { makeId } from '@/utils/format';
import { levelLabel } from '@/styles/theme';
import { severity } from './thresholds';

/** Cria o evento de mudança de estado, com texto calmo e sem ordens de evacuação. */
export function buildAlert(de: Level, para: Level, reading: Reading): AlertEvent {
  const subiu = severity(para) > severity(de);
  const mensagem = subiu
    ? `Mudou para ${levelLabel[para]}, com ${reading.nivelCm} cm.`
    : `Voltou para ${levelLabel[para]}, com ${reading.nivelCm} cm.`;
  return {
    id: makeId('a'),
    timestamp: reading.timestamp,
    de,
    para,
    nivelCm: reading.nivelCm,
    mensagem,
  };
}

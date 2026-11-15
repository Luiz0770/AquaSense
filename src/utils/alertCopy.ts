import type { Level } from '@/types';
import { levelLabel } from '@/styles/theme';
import { LIMITS } from '@/services/iot/thresholds';

/** Textos dos avisos: calmos, factuais, sem ordens de evacuação. */
export function bannerCopy(level: Level, time = ''): { title: string; message: string } {
  const at = time ? ` às ${time}` : '';
  switch (level) {
    case 'atencao':
      return {
        title: 'Nível da água em atenção',
        message: `O nível passou de ${LIMITS.atencao} cm${at}. Acompanhe as próximas leituras.`,
      };
    case 'alerta':
      return {
        title: 'Nível da água em alerta',
        message: `Nível acima de ${LIMITS.alerta} cm${at}. Estimativa não oficial. Confira os canais oficiais.`,
      };
    case 'critico':
      return {
        title: 'Nível da água crítico',
        message: `Nível acima de ${LIMITS.critico} cm${at}. Confira a Defesa Civil (199) e o CGE.`,
      };
    default:
      return { title: `Nível da água ${levelLabel[level].toLowerCase()}`, message: 'Sem mudanças a destacar.' };
  }
}

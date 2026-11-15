import type { ReportKind } from '@/types';
import type { IconName } from '@/components/Icon';

/** Tipos de relato do design, com o ícone de cada um. */
export const REPORT_KINDS: { kind: ReportKind; icon: IconName }[] = [
  { kind: 'Rua alagada', icon: 'flood' },
  { kind: 'Chuva forte', icon: 'thunderstorm' },
  { kind: 'Bueiro entupido', icon: 'delete_sweep' },
  { kind: 'Córrego subindo', icon: 'waves' },
];

/** Ícone do tipo; relatos antigos (sem tipo) usam a gota. */
export const kindIcon = (k?: ReportKind): IconName => REPORT_KINDS.find((x) => x.kind === k)?.icon ?? 'water_drop';

import type { Scenario } from '@/types';
import type { IconName } from '@/components/Icon';

/** Ícone e resumo curto de cada cenário do simulador, para os cartões da tela Simulação. */
export const SCENARIO_ICON: Record<Scenario, IconName> = {
  sem_chuva: 'wb_sunny',
  moderada: 'rainy',
  forte: 'thunderstorm',
};

export const SCENARIO_SHORT: Record<Scenario, string> = {
  sem_chuva: 'Nível desce até Normal',
  moderada: 'Oscila perto de Atenção',
  forte: 'Sobe até Crítico',
};

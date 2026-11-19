import type { Scenario } from '@/types';
import type { IconName } from '@/components/Icon';

/** Ícone e resumo curto de cada cenário do simulador, para os cartões da tela Simulação. */
export const SCENARIO_ICON: Record<Scenario, IconName> = {
  real: 'public',
  sem_chuva: 'wb_sunny',
  moderada: 'rainy',
  forte: 'thunderstorm',
  extrema: 'flood',
};

export const SCENARIO_SHORT: Record<Scenario, string> = {
  real: 'Chuva da Open-Meteo · Normal',
  sem_chuva: 'Fica em Normal',
  moderada: 'Fica em Atenção',
  forte: 'Fica em Alerta',
  extrema: 'Fica em Crítico',
};

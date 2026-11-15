/**
 * Outros pontos mostrados no radar do agente. São de DEMONSTRAÇÃO (valores fixos);
 * só o ponto piloto recebe leituras do simulador.
 */
export interface NetworkPoint {
  code: string;
  name: string;
  nivelCm: number;
  /** Posição no radar, em %. */
  x: number;
  y: number;
}

export const demoPoints: NetworkPoint[] = [
  { code: 'PT-11', name: 'PT-11 · demonstração', nivelCm: 24, x: 30, y: 66 },
  { code: 'PT-03', name: 'PT-03 · demonstração', nivelCm: 9, x: 72, y: 74 },
];

/** Posição do ponto piloto no radar. */
export const pilotRadar = { x: 58, y: 40 } as const;

/** Dados de demonstração. Marcados como tal na tela. */

export type HistoryPeriod = '7d' | '24h';

export interface HistorySeries {
  labels: string[];
  /** Chuva em mm em cada intervalo. */
  rain: number[];
  /** Nível máximo da água (cm) em cada intervalo. */
  level: number[];
}

export const history: Record<HistoryPeriod, HistorySeries> = {
  '7d': {
    labels: ['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom'],
    rain: [2, 0, 14, 38, 22, 5, 9],
    level: [8, 6, 24, 46, 33, 12, 18],
  },
  '24h': {
    labels: ['0h', '3h', '6h', '9h', '12h', '15h', '18h', '21h'],
    rain: [0, 0, 1, 3, 8, 15, 6, 2],
    level: [6, 6, 7, 10, 18, 31, 24, 14],
  },
};

export interface FloodEvent {
  id: string;
  dia: string;
  mes: string;
  /** Nível máximo registrado (cm). */
  nivel: number;
}

/** Alagamentos registrados perto do ponto. */
export const floodEvents: FloodEvent[] = [
  { id: 'ev-1', dia: '14', mes: 'nov', nivel: 33 },
  { id: 'ev-2', dia: '13', mes: 'nov', nivel: 46 },
  { id: 'ev-3', dia: '04', mes: 'nov', nivel: 27 },
  { id: 'ev-4', dia: '21', mes: 'out', nivel: 74 },
];

export interface DataSource {
  nome: string;
  descricao: string;
}

export const dataSources: DataSource[] = [
  { nome: 'Sensor ESP32 simulado', descricao: 'Nível da água. Dados de demonstração.' },
  { nome: 'GeoSampa e Defesa Civil', descricao: 'Ocorrências de alagamento desde 2013.' },
  { nome: 'INMET', descricao: 'Chuva histórica das estações automáticas.' },
  { nome: 'SP Águas (SIBH)', descricao: 'Chuva, nível e vazão históricos.' },
  { nome: 'Relatos', descricao: 'Não verificados até a revisão de um agente.' },
];

export const officialChannels = {
  defesaCivilTel: 'tel:199',
  defesaCivilSms: 'sms:40199',
  bombeirosTel: 'tel:193',
  cgeUrl: 'https://cge.prefeitura.sp.gov.br/v3/alagamentos-classificacao.jsp',
} as const;

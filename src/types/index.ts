export type Level = 'normal' | 'atencao' | 'alerta' | 'critico';

export type Role = 'cidadao' | 'agente';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: Role;
}

/** Usuário como é guardado no AsyncStorage (com hash da senha). */
export interface StoredUser extends User {
  passwordHash: string;
}

/** Leitura no mesmo formato que o ESP32 vai enviar. */
export interface Reading {
  id: string;
  sensorId: string;
  nivelCm: number;
  chuvaMm: number;
  /** ISO 8601 */
  timestamp: string;
}

export type Scenario = 'sem_chuva' | 'moderada' | 'forte';

export interface AlertEvent {
  id: string;
  /** ISO 8601 */
  timestamp: string;
  de: Level;
  para: Level;
  nivelCm: number;
  mensagem: string;
}

export type ReportKind = 'Rua alagada' | 'Chuva forte' | 'Bueiro entupido' | 'Córrego subindo';

export type ReportStatus = 'pendente' | 'validado' | 'descartado';

export interface Report {
  id: string;
  /** CEP no formato 00000-000 (nunca endereço completo). */
  cep: string;
  /** Data e hora da observação, ISO 8601. */
  observadoEm: string;
  alturaCm: number;
  descricao: string;
  status: ReportStatus;
  /** ISO 8601 */
  criadoEm: string;
  autorId?: string;
  /** O que a pessoa viu (Rua alagada, Chuva forte...). Relatos antigos não têm. */
  tipo?: ReportKind;
  /** Foto anexada (demonstração: só marca que houve foto). */
  comFoto?: boolean;
}

export type FontSize = 'normal' | 'grande' | 'muito_grande';

export interface Settings {
  fontSize: FontSize;
  highContrast: boolean;
  reduceMotion: boolean;
  noticeDismissed: boolean;
}

import type { Report, ReportKind, ReportStatus } from '@/types';
import { getItem, setItem, StorageKeys } from './storage';
import { makeId } from '@/utils/format';
import { pilotPoint } from '@/data/pilotPoint';

export function saveReports(reports: Report[]): Promise<void> {
  return setItem(StorageKeys.reports, reports);
}

/** Relatos de demonstração, para o painel do agente não começar vazio. */
function demoReports(now: Date): Report[] {
  const at = (minAgo: number) => new Date(now.getTime() - minAgo * 60_000).toISOString();
  return [
    {
      id: makeId('rep'),
      cep: pilotPoint.cep,
      observadoEm: at(4),
      criadoEm: at(4),
      alturaCm: 15,
      descricao: 'Água na altura do meio-fio.',
      status: 'pendente',
      tipo: 'Rua alagada',
      comFoto: true,
    },
    {
      id: makeId('rep'),
      cep: pilotPoint.cep,
      observadoEm: at(26),
      criadoEm: at(26),
      alturaCm: 5,
      descricao: 'Rua com pouca água, carros passando devagar.',
      status: 'pendente',
    },
    {
      id: makeId('rep'),
      cep: pilotPoint.cep,
      observadoEm: at(54),
      criadoEm: at(54),
      alturaCm: 5,
      descricao: 'Água na calçada.',
      status: 'validado',
    },
  ];
}

/** Relatos mais novos primeiro. Na primeira abertura, grava os de demonstração. */
export async function loadReports(): Promise<Report[]> {
  const seeded = await getItem<boolean>(StorageKeys.reportsSeeded, false);
  if (!seeded) {
    const seed = demoReports(new Date());
    await saveReports(seed);
    await setItem(StorageKeys.reportsSeeded, true);
    return seed;
  }
  return getItem<Report[]>(StorageKeys.reports, []);
}

export interface NewReportInput {
  cep: string;
  observadoEm: Date;
  alturaCm: number;
  descricao: string;
  autorId?: string;
  tipo?: ReportKind;
  comFoto?: boolean;
  fotoUri?: string;
}

export function createReport(input: NewReportInput): Report {
  return {
    id: makeId('rep'),
    cep: input.cep,
    observadoEm: input.observadoEm.toISOString(),
    criadoEm: new Date().toISOString(),
    alturaCm: input.alturaCm,
    descricao: input.descricao.trim(),
    status: 'pendente',
    autorId: input.autorId,
    ...(input.tipo ? { tipo: input.tipo } : {}),
    ...(input.comFoto || input.fotoUri ? { comFoto: true } : {}),
    ...(input.fotoUri ? { fotoUri: input.fotoUri } : {}),
  };
}

export function withStatus(reports: Report[], id: string, status: ReportStatus): Report[] {
  return reports.map((r) => (r.id === id ? { ...r, status } : r));
}

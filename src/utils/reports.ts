import type { Report } from '@/types';

/** O relato tem foto: a imagem real (fotoUri) ou só a marca de relatos antigos (comFoto). */
export function hasReportPhoto(r: Pick<Report, 'comFoto' | 'fotoUri'>): boolean {
  return !!r.fotoUri || !!r.comFoto;
}

/** Número curto do relato para mostrar na tela ("A1B2"), tirado do fim do id. */
export function reportNumber(id: string): string {
  const clean = id.replace(/[^a-z0-9]/gi, '');
  return clean.slice(-4).toUpperCase().padStart(4, '0');
}

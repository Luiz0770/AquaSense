import type { Level, ReportStatus } from '@/types';

/**
 * Tokens do design "AquaSense Mobile v2" (Claude Design).
 * Os nomes curtos do design ficam nos comentários: bg, sf, ink, mu, ln, bd, nv, ac, tl, acbg, btn.
 */
export interface Palette {
  /** bg: fundo das telas */
  bg: string;
  /** sf: superfície dos cartões */
  surface: string;
  /** ink: texto principal */
  ink: string;
  /** mu: texto secundário */
  inkMuted: string;
  /** ln: linhas e bordas suaves */
  line: string;
  /** bd: borda dos campos */
  border: string;
  /** nv: azul-marinho da marca */
  navy: string;
  /** ac: azul de ação */
  accent: string;
  /** tl: verde-água */
  teal: string;
  /** acbg: fundo suave de destaque */
  accentBg: string;
  /** btn: gradiente do botão principal (uma cor só no alto contraste) */
  button: readonly [string, string];
  /** Gradiente dos itens selecionados (cartões de opção). */
  selected: readonly [string, string];
  /** Gradiente do ícone da aba ativa. */
  tabActive: readonly [string, string];
  selectedBorder: string;
  error: string;
  focus: string;
  /** Alto contraste desliga sombras e brilhos. */
  shadows: boolean;
}

export const light: Palette = {
  bg: '#EAF4FB',
  surface: '#FFFFFF',
  ink: '#06213A',
  inkMuted: '#3F5B73',
  line: '#CFE3F1',
  border: '#5E7C95',
  navy: '#052A52',
  accent: '#0066E0',
  teal: '#00838F',
  accentBg: '#DDEEFF',
  button: ['#0047B3', '#0066E0'],
  selected: ['#0047B3', '#0077D9'],
  tabActive: ['#00B8D9', '#0052CC'],
  selectedBorder: '#0052CC',
  error: '#B3261E',
  focus: '#38D6FF',
  shadows: true,
};

export const highContrast: Palette = {
  bg: '#FFFFFF',
  surface: '#FFFFFF',
  ink: '#000000',
  inkMuted: '#000000',
  line: '#000000',
  border: '#000000',
  navy: '#000000',
  accent: '#003A8C',
  teal: '#004C4B',
  accentBg: '#FFFFFF',
  button: ['#000000', '#000000'],
  selected: ['#000000', '#000000'],
  tabActive: ['#000000', '#000000'],
  selectedBorder: '#000000',
  error: '#B3261E',
  focus: '#003A8C',
  shadows: false,
};

/** Cores fixas do "palco" escuro (cartões holográficos). Iguais nos dois temas. */
export const stage = {
  deep: '#04274D',
  mid: '#063E73',
  low: '#08508F',
  glow: '#1585D8',
  darkest: '#041D3A',
  cyan: '#7CF3FF',
  cyanSoft: '#9AF6FF',
  cyanLine: 'rgba(124,243,255,0.8)',
  sky: '#38D6FF',
  ink: '#FFFFFF',
  muted: '#BFE3FF',
  muted2: '#D6ECFF',
  rain: '#9CC4FF',
} as const;

/** Gradientes usados nos ícones e blocos coloridos do design. */
export const gradients = {
  sensor: ['#00B8D9', '#0052CC'],
  history: ['#5AA0FF', '#1E3FD8'],
  report: ['#00C2A8', '#00737D'],
  official: ['#0A5C9E', '#052A52'],
  rain: ['#1E6BFF', '#0047B3'],
  teal: ['#008C96', '#005F73'],
  drop: ['#38D6FF', '#0052CC'],
  dropBig: ['#7CF3FF', '#0066E0'],
  rainBar: ['#5AA0FF', '#1E6BFF'],
  levelBar: ['#3FE0D0', '#00A3AD'],
} as const satisfies Record<string, readonly [string, string]>;

export const chart = {
  level: '#00A3AD',
  levelLight: '#3FE0D0',
  rain: '#1E6BFF',
  rainLight: '#5AA0FF',
  forecast: '#1457D9',
  /** Linhas tracejadas dos limiares nos gráficos claros. */
  thresholds: { atencao: '#B07D00', alerta: '#C2560F', critico: '#B3261E' },
  /** Marcas dos limiares no palco escuro. */
  holoTicks: { atencao: '#FFC94D', alerta: '#FF8A3D', critico: '#FF6B83' },
} as const;

export interface LevelStyle {
  label: string;
  icon: 'check_circle' | 'info' | 'warning' | 'dangerous';
  fg: string;
  bg: string;
  glow: string;
  range: string;
  desc: string;
}

export const levelStyle: Record<Level, LevelStyle> = {
  normal: { label: 'Normal', icon: 'check_circle', fg: '#0B6B4F', bg: '#DDF7EE', glow: '#19C59A', range: '0–19 cm', desc: 'Nível da água dentro do esperado.' },
  atencao: { label: 'Atenção', icon: 'info', fg: '#7A5300', bg: '#FFF2C7', glow: '#FFC94D', range: '20–39 cm', desc: 'A água está subindo. Acompanhe as atualizações.' },
  alerta: { label: 'Alerta', icon: 'warning', fg: '#9A3B00', bg: '#FFE2CC', glow: '#FF8A3D', range: '40–69 cm', desc: 'Nível alto. Consulte a Defesa Civil (199) antes de sair.' },
  critico: { label: 'Crítico', icon: 'dangerous', fg: '#A1112E', bg: '#FFDDE3', glow: '#FF4D6A', range: '70 cm ou mais', desc: 'Nível muito alto. Siga a Defesa Civil (199) e o CGE.' },
};

export const reportStatusStyle: Record<ReportStatus, { label: string; icon: 'schedule' | 'verified' | 'block'; fg: string; bg: string }> = {
  pendente: { label: 'Não verificado', icon: 'schedule', fg: '#33475B', bg: '#E8EEF4' },
  validado: { label: 'Validado', icon: 'verified', fg: '#0B6B4F', bg: '#DDF7EE' },
  descartado: { label: 'Descartado', icon: 'block', fg: '#8A1C2E', bg: '#FBE3E7' },
};

export const space = { 1: 4, 2: 8, 3: 12, 4: 16, 5: 24, 6: 32, touch: 48 } as const;
export const radius = { sm: 12, md: 16, lg: 20, xl: 24, xxl: 28, pill: 999 } as const;

export const fonts = {
  sans: 'AtkinsonHyperlegible_400Regular',
  sansBold: 'AtkinsonHyperlegible_700Bold',
  display500: 'Sora_500Medium',
  display600: 'Sora_600SemiBold',
  display700: 'Sora_700Bold',
  mono: 'JetBrainsMono_400Regular',
  monoSemi: 'JetBrainsMono_600SemiBold',
} as const;

/** Tamanho do texto (Perfil): Padrão, Grande, Maior. */
export const fontScaleBySize = { normal: 1, grande: 1.15, muito_grande: 1.3 } as const;

export const levelLabel: Record<Level, string> = {
  normal: 'Normal',
  atencao: 'Atenção',
  alerta: 'Alerta',
  critico: 'Crítico',
};

export const levelMeaning: Record<Level, string> = {
  normal: 'nível da água normal',
  atencao: 'nível da água em atenção',
  alerta: 'nível da água em alerta',
  critico: 'nível da água crítico',
};

/** Sombra suave dos cartões claros (0 6px 18px rgba(5,42,82,.07)). */
export function cardShadow(p: Palette, strength = 0.07) {
  if (!p.shadows) return {};
  return {
    shadowColor: '#052A52',
    shadowOpacity: strength,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  };
}

/** Sombra dos cartões escuros e botões principais. */
export function glowShadow(p: Palette, color = '#04274D', opacity = 0.35, radiusPx = 36, y = 18) {
  if (!p.shadows) return {};
  return {
    shadowColor: color,
    shadowOpacity: opacity,
    shadowRadius: radiusPx,
    shadowOffset: { width: 0, height: y },
    elevation: 6,
  };
}

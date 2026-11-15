import React from 'react';
import { Text, View, type TextProps, type TextStyle } from 'react-native';
import { useTheme } from '@/contexts/SettingsContext';
import { fonts } from '@/styles/theme';
import { Icon } from './Icon';

type Font = 'sans' | 'display' | 'mono';

interface Props extends TextProps {
  /** Tamanho em px no texto Padrão; cresce com o ajuste do Perfil. */
  size?: number;
  font?: Font;
  /** sans: 400/700 · display (Sora): 500/600/700 · mono: 400/600 */
  weight?: 400 | 500 | 600 | 700;
  color?: string;
  muted?: boolean;
  /** Altura da linha em relação ao tamanho (padrão 1,4, como no design). */
  lh?: number;
  align?: TextStyle['textAlign'];
}

function family(font: Font, weight: number): string {
  if (font === 'display') return weight >= 700 ? fonts.display700 : weight >= 600 ? fonts.display600 : fonts.display500;
  if (font === 'mono') return weight >= 600 ? fonts.monoSemi : fonts.mono;
  return weight >= 600 ? fonts.sansBold : fonts.sans;
}

/** Todo texto do app passa por aqui: fonte do design, tamanho ajustável e cor do tema. */
export function AppText({
  size = 16,
  font = 'sans',
  weight,
  color,
  muted,
  lh = 1.4,
  align,
  style,
  children,
  ...rest
}: Props) {
  const { palette, fontScale } = useTheme();
  const w = weight ?? (font === 'display' ? 700 : 400);
  const fs = size * fontScale;
  const resolved: TextStyle = {
    fontFamily: family(font, w),
    fontSize: fs,
    lineHeight: Math.round(fs * lh),
    color: color ?? (muted ? palette.inkMuted : palette.ink),
    textAlign: align,
  };
  return (
    <Text maxFontSizeMultiplier={1.4} {...rest} style={[resolved, style]}>
      {children}
    </Text>
  );
}

/** Mensagem de erro de campo, com ícone (nunca só cor). */
export function ErrorText({ children }: { children: React.ReactNode }) {
  const { palette, fontScale } = useTheme();
  return (
    <View accessibilityLiveRegion="polite" style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <Icon name="error" size={18 * fontScale} color={palette.error} />
      <AppText size={14} color={palette.error} style={{ flex: 1 }}>
        {children}
      </AppText>
    </View>
  );
}

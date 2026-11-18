import React from 'react';
import { Pressable, View, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/SettingsContext';
import { glowShadow, gradients } from '@/styles/theme';
import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';

type Variant = 'primary' | 'outline' | 'soft' | 'ghost' | 'danger' | 'teal' | 'white';

interface Props extends Omit<PressableProps, 'style' | 'children'> {
  label: string;
  icon?: IconName;
  variant?: Variant;
  /** Altura mínima (48 a 56 no design). */
  height?: number;
  /** Rótulo em Sora (botões principais) ou Atkinson negrito (secundários). */
  display?: boolean;
  textColor?: string;
  /** Versão compacta para botões estreitos (lado a lado): menos padding, ícone e texto menores. */
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** Botões do design: principal com gradiente, contorno marinho, suave, transparente e perigo (Sair). */
export function Button({ label, icon, variant = 'primary', height, display, textColor, compact, disabled, style, ...rest }: Props) {
  const { palette, fontScale } = useTheme();
  const h = height ?? (variant === 'primary' ? 56 : 52);
  const fg =
    textColor ??
    {
      primary: '#FFFFFF',
      teal: '#FFFFFF',
      outline: palette.navy,
      soft: palette.navy,
      ghost: palette.navy,
      danger: palette.error,
      white: '#005F73',
    }[variant];
  const useDisplay = display ?? variant === 'primary';
  const radius = variant === 'primary' ? 18 : 16;

  const content = (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: compact ? 6 : 8, paddingHorizontal: compact ? 10 : 16, minHeight: h }}>
      {icon ? <Icon name={icon} size={(compact ? 20 : 22) * fontScale} color={fg} /> : null}
      <AppText
        font={useDisplay ? 'display' : 'sans'}
        weight={useDisplay ? 600 : 700}
        size={useDisplay ? 17 : compact ? 15 : 16}
        lh={compact ? 1.15 : 1.2}
        color={fg}
        align="center"
        style={{ flexShrink: 1 }}
      >
        {label}
      </AppText>
    </View>
  );

  const base: ViewStyle = { borderRadius: radius, opacity: disabled ? 0.6 : 1 };
  const frame: StyleProp<ViewStyle> = [
    base,
    variant === 'outline' && { borderWidth: 2, borderColor: palette.navy, backgroundColor: palette.surface },
    variant === 'soft' && { backgroundColor: palette.accentBg },
    variant === 'white' && { backgroundColor: '#FFFFFF' },
    variant === 'primary' && glowShadow(palette, '#0052CC', 0.35, 24, 10),
  ];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      style={({ pressed }) => [frame, pressed && { transform: [{ scale: 0.98 }] }, style]}
      {...rest}
    >
      {variant === 'primary' || variant === 'teal' ? (
        <LinearGradient
          colors={variant === 'teal' ? gradients.teal : palette.button}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ borderRadius: radius }}
        >
          {content}
        </LinearGradient>
      ) : (
        content
      )}
    </Pressable>
  );
}

import React from 'react';
import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/SettingsContext';
import { gradients, stage } from '@/styles/theme';
import { AppText } from './AppText';
import { Icon } from './Icon';

/**
 * Marca do design: gota (quadrado girado 45° com três cantos redondos)
 * em gradiente ciano → azul, com o sinal de sensor (wifi) dentro.
 */
export function LogoMark({ size = 28, big = false }: { size?: number; big?: boolean }) {
  const { palette } = useTheme();
  const colors = big ? gradients.dropBig : gradients.drop;
  const r = size / 2;
  return (
    <View
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      style={[
        { width: size, height: size, transform: [{ rotate: '45deg' }] },
        palette.shadows && {
          shadowColor: big ? stage.sky : '#00B8D9',
          shadowOpacity: big ? 0.6 : 0.5,
          shadowRadius: big ? 40 : 12,
          shadowOffset: { width: 0, height: 0 },
          elevation: big ? 12 : 4,
        },
      ]}
    >
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          borderTopLeftRadius: 0,
          borderTopRightRadius: r,
          borderBottomRightRadius: r,
          borderBottomLeftRadius: r,
        }}
      >
        <View style={{ transform: [{ rotate: '-45deg' }] }}>
          <Icon name="wifi" size={size * (big ? 0.51 : 0.57)} color="#FFFFFF" />
        </View>
      </LinearGradient>
    </View>
  );
}

/** "Aqua" + "Sense" em Sora negrito. `onDark` usa branco e ciano (telas de entrada). */
export function Wordmark({ size = 18, onDark = false }: { size?: number; onDark?: boolean }) {
  const { palette } = useTheme();
  return (
    <AppText
      font="display"
      weight={700}
      size={size}
      lh={1.15}
      color={onDark ? '#FFFFFF' : palette.navy}
      style={{ letterSpacing: size > 24 ? -0.02 * size : 0 }}
      accessibilityRole="header"
      accessibilityLabel="AquaSense"
    >
      Aqua<AppText font="display" weight={700} size={size} lh={1.15} color={onDark ? stage.cyan : palette.accent}>Sense</AppText>
    </AppText>
  );
}

export function Logo({ markSize = 28, textSize = 18 }: { markSize?: number; textSize?: number }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <LogoMark size={markSize} />
      <Wordmark size={textSize} />
    </View>
  );
}

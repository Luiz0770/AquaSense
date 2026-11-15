import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { HeroWaves, StageBackground } from './Surfaces';

/** Cabeçalho escuro das telas de entrada, com o brilho azul e as ondas animadas na base. */
export function AuthHero({ children, style, glow = true }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; glow?: boolean }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[{ paddingTop: insets.top, overflow: 'hidden' }, style]}>
      <StatusBar style="light" />
      <StageBackground glow={glow ? { cx: 0.7, cy: 0.1, rx: 0.9, ry: 0.7, stop: 0.6 } : undefined} />
      {children}
      <HeroWaves />
    </View>
  );
}

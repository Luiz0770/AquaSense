import React, { useState } from 'react';
import { Animated, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, LinearGradient as SvgLinear, Path, RadialGradient, Rect, Stop } from 'react-native-svg';
import { useTheme } from '@/contexts/SettingsContext';
import { cardShadow, glowShadow, stage } from '@/styles/theme';
import { useLoop } from './motion';

type Grad = readonly [string, string];

/** Cartão claro: fundo da superfície, borda suave e sombra leve. */
export function Card({ children, style, radius = 22, padding = 16 }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; radius?: number; padding?: number }) {
  const { palette } = useTheme();
  return (
    <View
      style={[
        { backgroundColor: palette.surface, borderColor: palette.line, borderWidth: 1, borderRadius: radius, padding, gap: 10 },
        cardShadow(palette, 0.06),
        style,
      ]}
    >
      {children}
    </View>
  );
}

/** Bloco com gradiente a 135° (ícones, blocos coloridos). */
export function Gradient({ colors, style, children }: { colors: Grad; style?: StyleProp<ViewStyle>; children?: React.ReactNode }) {
  return (
    <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={style}>
      {children}
    </LinearGradient>
  );
}

interface Glow {
  /** Centro do brilho, de 0 a 1. */
  cx: number;
  cy: number;
  /** Raios do brilho em fração da largura e da altura. */
  rx: number;
  ry: number;
  /** Onde o brilho some (0 a 1). */
  stop?: number;
}

/**
 * Fundo do "palco" escuro do design: gradiente marinho
 * (#04274D → #063E73 → #08508F) com um brilho radial azul.
 */
export function StageBackground({ glow, vertical = false, colors }: { glow?: Glow; vertical?: boolean; colors?: readonly string[] }) {
  const stops = colors ?? [stage.deep, stage.mid, stage.low];
  const pos = stops.length === 3 ? [0, 0.6, 1] : stops.map((_, i) => i / (stops.length - 1));
  return (
    <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 100 100">
      <Defs>
        <SvgLinear id="st" x1={vertical ? 0.5 : 0.37} y1="0" x2={vertical ? 0.5 : 0.63} y2="1">
          {stops.map((c, i) => (
            <Stop key={i} offset={pos[i]} stopColor={c} />
          ))}
        </SvgLinear>
        {glow ? (
          <RadialGradient id="gl" cx={glow.cx} cy={glow.cy} rx={glow.rx} ry={glow.ry} fx={glow.cx} fy={glow.cy}>
            <Stop offset={0} stopColor={stage.glow} stopOpacity={1} />
            <Stop offset={glow.stop ?? 0.6} stopColor={stage.glow} stopOpacity={0} />
          </RadialGradient>
        ) : null}
      </Defs>
      <Rect x="0" y="0" width="100" height="100" fill="url(#st)" />
      {glow ? <Rect x="0" y="0" width="100" height="100" fill="url(#gl)" /> : null}
    </Svg>
  );
}

/** Cartão escuro com o palco e sombra azul. */
export function StageCard({
  children,
  style,
  glow,
  vertical,
  radius = 28,
  padding = 16,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  glow?: Glow;
  vertical?: boolean;
  radius?: number;
  padding?: number;
}) {
  const { palette } = useTheme();
  return (
    <View style={[{ borderRadius: radius }, glowShadow(palette), { backgroundColor: stage.mid }]}>
      <View style={[{ borderRadius: radius, overflow: 'hidden', padding }, style]}>
        <StageBackground glow={glow} vertical={vertical} />
        {children}
      </View>
    </View>
  );
}

/** Uma faixa de onda (o SVG do design), repetida duas vezes para rolar sem emenda. */
function WaveShape({ width, height, fill }: { width: number; height: number; fill: string }) {
  return (
    <Svg width={width} height={height} viewBox="0 0 100 20" preserveAspectRatio="none">
      <Path d="M0 10 Q 12.5 2 25 10 T 50 10 T 75 10 T 100 10 V20 H0 Z" fill={fill} />
    </Svg>
  );
}

/** aqWave: onda que rola para o lado. `reverse` rola no sentido contrário. */
export function WaveStrip({
  fill,
  height,
  durationMs,
  reverse,
  opacity = 1,
  style,
}: {
  fill: string;
  height: number;
  durationMs: number;
  reverse?: boolean;
  opacity?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const [w, setW] = useState(0);
  const t = useLoop(durationMs);
  const tx = t.interpolate({ inputRange: [0, 1], outputRange: reverse ? [-w, 0] : [0, -w] });
  return (
    <View
      pointerEvents="none"
      onLayout={(e) => setW(e.nativeEvent.layout.width)}
      style={[{ position: 'absolute', left: 0, right: 0, height, overflow: 'hidden', opacity }, style]}
    >
      {w > 0 ? (
        <Animated.View style={{ flexDirection: 'row', width: w * 2, height, transform: [{ translateX: tx }] }}>
          <WaveShape width={w} height={height} fill={fill} />
          <WaveShape width={w} height={height} fill={fill} />
        </Animated.View>
      ) : null}
    </View>
  );
}

/** Ondas na base dos cabeçalhos escuros (Entrar e Criar conta). A última tem a cor do fundo da tela. */
export function HeroWaves() {
  const { palette } = useTheme();
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, bottom: -1, height: 64, overflow: 'hidden' }}>
      <WaveStrip fill={stage.cyan} height={38} durationMs={9000} reverse opacity={0.35} style={{ bottom: 16 }} />
      <WaveStrip fill={stage.sky} height={40} durationMs={6000} opacity={0.5} style={{ bottom: 6 }} />
      <WaveStrip fill={palette.bg} height={34} durationMs={4000} style={{ bottom: 0 }} />
    </View>
  );
}

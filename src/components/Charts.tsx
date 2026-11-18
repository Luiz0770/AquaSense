import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, Line, LinearGradient as SvgLinear, Path, Stop } from 'react-native-svg';
import { useTheme } from '@/contexts/SettingsContext';
import { AppText } from './AppText';

/** Gráfico de área do design (sensor ao vivo), com linhas tracejadas dos limiares. */
export function AreaChart({
  data,
  max,
  color,
  light,
  height,
  thresholds,
}: {
  data: number[];
  max: number;
  color: string;
  light: string;
  height: number;
  thresholds?: [number, string][];
}) {
  const W = 300;
  const n = Math.max(2, data.length);
  const series = data.length >= 2 ? data : [data[0] ?? 0, data[0] ?? 0];
  const pts = series.map((v, i) => [(i / (n - 1)) * W, height - (Math.min(v, max) / max) * (height - 4)]);
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
  const id = `aq${color.replace('#', '')}`;
  return (
    <Svg width="100%" height={height} viewBox={`0 0 ${W} ${height}`} preserveAspectRatio="none" accessible={false}>
      <Defs>
        <SvgLinear id={id} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={light} stopOpacity={0.55} />
          <Stop offset="1" stopColor={color} stopOpacity={0} />
        </SvgLinear>
      </Defs>
      {(thresholds ?? []).map(([v, c]) => {
        const y = height - (v / max) * (height - 4);
        return <Line key={v} x1={0} x2={W} y1={y} y2={y} stroke={c} strokeWidth={1.5} strokeDasharray="5 4" vectorEffect="non-scaling-stroke" />;
      })}
      <Path d={`${line} L${W} ${height} L0 ${height} Z`} fill={`url(#${id})`} />
      <Path d={line} fill="none" stroke={color} strokeWidth={3} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </Svg>
  );
}

const BAR_H = 110;
const BAR_EASE = Easing.bezier(0.25, 0.1, 0.25, 1); // "ease" do CSS, como no design

/**
 * Uma barra que cresce/encolhe até a nova altura (transition: height .6s ease do design).
 * Ao trocar o período (7 dias ↔ 24 h), as barras existentes mudam de altura e as novas sobem do zero.
 */
function AnimatedBar({ pct, colors }: { pct: number; colors: readonly [string, string] }) {
  const { reduceMotion } = useTheme();
  const target = Math.max(4, (pct / 100) * BAR_H);
  const h = useSharedValue(reduceMotion ? target : 0);
  useEffect(() => {
    h.value = reduceMotion ? target : withTiming(target, { duration: 600, easing: BAR_EASE });
  }, [target, reduceMotion, h]);
  const style = useAnimatedStyle(() => ({ height: h.value }));
  return (
    <Animated.View style={[{ flex: 1 }, style]}>
      <LinearGradient colors={colors} style={{ flex: 1, borderRadius: 8 }} />
    </Animated.View>
  );
}

/** Barras verticais com gradiente e rótulos (Histórico). */
export function BarChart({
  values,
  labels,
  max,
  colors,
  thresholds,
  unit,
}: {
  values: number[];
  labels: string[];
  max: number;
  colors: readonly [string, string];
  /** Linhas tracejadas em % da altura. */
  thresholds?: [number, string][];
  unit: string;
}) {
  const { palette } = useTheme();
  return (
    <View
      accessible
      accessibilityLabel={values.map((v, i) => `${labels[i]}: ${v} ${unit}`).join('; ')}
      style={{ gap: 10 }}
    >
      <View style={{ height: BAR_H, flexDirection: 'row', alignItems: 'flex-end', gap: 8 }}>
        {(thresholds ?? []).map(([p, c]) => (
          <View key={p} pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, bottom: `${p}%`, height: 2 }}>
            <Svg width="100%" height={2}>
              <Line x1="0" y1="1" x2="100%" y2="1" stroke={c} strokeWidth={1.5} strokeDasharray="5 4" />
            </Svg>
          </View>
        ))}
        {values.map((v, i) => (
          <AnimatedBar key={i} pct={Math.max(3, Math.min(100, (v / max) * 100))} colors={colors} />
        ))}
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {values.map((v, i) => (
          <View key={i} style={{ flex: 1, alignItems: 'center' }}>
            <AppText size={14} weight={700} lh={1.25}>
              {String(v)}
            </AppText>
            <AppText size={14} lh={1.25} color={palette.inkMuted} numberOfLines={1}>
              {labels[i]}
            </AppText>
          </View>
        ))}
      </View>
    </View>
  );
}

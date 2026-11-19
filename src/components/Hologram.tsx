import React, { useEffect, useMemo, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, Ellipse, Line, LinearGradient as SvgLinear, Path, Polygon, RadialGradient, Rect, Stop } from 'react-native-svg';
import { useTheme } from '@/contexts/SettingsContext';
import { LIMITS } from '@/services/iot/thresholds';
import { chart } from '@/styles/theme';
import { AppText } from './AppText';
import { Glow, NATIVE_DRIVER, useLoop } from './motion';
import { WaveStrip } from './Surfaces';

const fmtN = (n: number) => String(n).replace('.', ',');
const TICKS: [number, string][] = [
  [LIMITS.atencao, chart.holoTicks.atencao],
  [LIMITS.alerta, chart.holoTicks.alerta],
  [LIMITS.critico, chart.holoTicks.critico],
];
const FILL = { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 } as const;
const RISE = Easing.bezier(0.3, 0.7, 0.3, 1);

/** Acompanha um número com a transição de 1,2 s do design (a água sobe e desce suave). */
function useSmooth(target: number) {
  const { reduceMotion } = useTheme();
  const [v] = useState(() => new Animated.Value(target));
  useEffect(() => {
    if (reduceMotion) {
      v.setValue(target);
      return;
    }
    const a = Animated.timing(v, { toValue: target, duration: 1200, easing: RISE, useNativeDriver: NATIVE_DRIVER });
    a.start();
    return () => a.stop();
  }, [target, reduceMotion, v]);
  return v;
}

/** aqBubble: bolha que sobe e some. */
function Bubble({ left, size, durationMs, delayMs, rise }: { left: string; size: number; durationMs: number; delayMs: number; rise: number }) {
  const t = useLoop(durationMs, { delayMs, easing: Easing.in(Easing.quad) });
  return (
    <Animated.View
      style={{
        position: 'absolute',
        bottom: 4,
        left: left as `${number}%`,
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.85)',
        opacity: t.interpolate({ inputRange: [0, 0.25, 1], outputRange: [0, 0.9, 0] }),
        transform: [{ translateY: t.interpolate({ inputRange: [0, 1], outputRange: [0, -rise] }) }],
      }}
    />
  );
}

/** aqScan: faixa clara que varre o holograma de cima a baixo. */
function ScanLine({ height, band, durationMs }: { height: number; band: number; durationMs: number }) {
  const t = useLoop(durationMs, { rest: -1 });
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        height: band,
        transform: [{ translateY: t.interpolate({ inputRange: [-1, 0, 1], outputRange: [-band * 4, -0.15 * height, 1.1 * height] }) }],
      }}
    >
      <LinearGradient colors={['transparent', 'rgba(154,246,255,0.35)', 'transparent']} style={{ flex: 1 }} />
    </Animated.View>
  );
}

/**
 * Holograma do nível: cilindro de luz com água, ondas, bolhas, varredura e
 * as marcas de 20/40/70 cm. O cilindro tem cantos elípticos (W/2 × 16 px):
 * desenhamos numa caixa mais alta com cantos redondos e achatamos com scaleY.
 */
export function Holo({ level, H = 200, W = 108 }: { level: number; H?: number; W?: number }) {
  const pct = Math.max(3, Math.min(100, level));
  const k = 32 / W;
  const Hp = H / k;
  const water = useSmooth(Hp * (1 - pct / 100));
  const lines = Math.floor(H / 14);

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={`Holograma do nível da água: ${fmtN(level)} centímetros`}
      style={{ width: W + 44, height: H + 30 }}
    >
      {/* Feixe de luz atrás do cilindro */}
      <Svg style={{ position: 'absolute', left: -6, bottom: 6, opacity: 0.5 }} width={W + 12} height={H * 0.95}>
        <Defs>
          <SvgLinear id="beam" x1="0" y1="1" x2="0" y2="0">
            <Stop offset="0" stopColor="#00E5FF" stopOpacity={0.38} />
            <Stop offset="1" stopColor="#00E5FF" stopOpacity={0} />
          </SvgLinear>
        </Defs>
        <Polygon
          points={`${(W + 12) * 0.32},${H * 0.95} ${(W + 12) * 0.68},${H * 0.95} ${W + 12},0 0,0`}
          fill="url(#beam)"
        />
      </Svg>
      {/* Base luminosa */}
      <Glow style={{ position: 'absolute', left: W * 0.12, width: W * 0.76, bottom: 0, height: 16 }}>
        <Svg width={W * 0.76} height={16}>
          <Defs>
            <RadialGradient id="base" cx="0.5" cy="0.5" rx="0.5" ry="0.5">
              <Stop offset="0" stopColor="#9AF6FF" stopOpacity={1} />
              <Stop offset="0.4" stopColor="#00B4FF" stopOpacity={0.55} />
              <Stop offset="0.72" stopColor="#00B4FF" stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Ellipse cx={(W * 0.76) / 2} cy={8} rx={(W * 0.76) / 2} ry={8} fill="url(#base)" />
        </Svg>
      </Glow>

      {/* Cilindro */}
      <View style={{ position: 'absolute', left: 0, bottom: 20, width: W, height: H }}>
        <View
          style={{
            width: W,
            height: Hp,
            borderRadius: W / 2,
            overflow: 'hidden',
            backgroundColor: 'rgba(0,140,255,0.08)',
            transform: [{ translateY: (H - Hp) / 2 }, { scaleY: k }],
          }}
        >
          {Array.from({ length: lines }, (_, i) => (
            <View
              key={i}
              style={{ position: 'absolute', left: 0, right: 0, bottom: (i * 14) / k, height: 1 / k, backgroundColor: 'rgba(124,243,255,0.12)' }}
            />
          ))}
          <Animated.View style={{ position: 'absolute', left: 0, right: 0, top: 0, height: Hp, transform: [{ translateY: water }] }}>
            <LinearGradient colors={['rgba(56,214,255,0.92)', 'rgba(0,102,224,0.92)']} style={StyleSheet.absoluteFill} />
            <WaveStrip fill="#9AF6FF" height={12 / k} durationMs={5000} reverse opacity={0.55} style={{ top: -9 / k }} />
            <WaveStrip fill="rgba(56,214,255,0.95)" height={12 / k} durationMs={3000} style={{ top: -9 / k }} />
          </Animated.View>
          <ScanLine height={Hp} band={26 / k} durationMs={3600} />
        </View>
        {/* Bolhas fora do achatamento, para ficarem redondas; sobem a partir do fundo */}
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, { overflow: 'hidden', borderRadius: 16 }]}>
          {[18, 42, 64, 80].map((x, i) => (
            <Bubble
              key={i}
              left={`${x}%`}
              size={5 + (i % 2) * 3}
              durationMs={2600 + i * 500}
              delayMs={i * 700}
              rise={Math.min(70, (H * pct) / 100 - 10)}
            />
          ))}
        </View>
        <Svg pointerEvents="none" style={StyleSheet.absoluteFill} width={W} height={H}>
          <Rect x={0.75} y={0.75} width={W - 1.5} height={H - 1.5} rx={W / 2} ry={16} fill="none" stroke="rgba(124,243,255,0.8)" strokeWidth={1.5} />
        </Svg>
      </View>

      {TICKS.map(([v, c]) => (
        <View
          key={v}
          importantForAccessibility="no-hide-descendants"
          style={{ position: 'absolute', left: W - 4, bottom: 20 + (H * v) / 100 - 9, flexDirection: 'row', alignItems: 'center', gap: 3 }}
        >
          <View style={{ width: 12, height: 2, backgroundColor: c }} />
          <AppText font="display" weight={600} size={14} lh={1.2} color={c} allowFontScaling={false}>
            {String(v)}
          </AppText>
        </View>
      ))}
    </View>
  );
}

/** aqPing: ponto com anel que pulsa. */
function PingDot({ color, size = 16 }: { color: string; size?: number }) {
  const t = useLoop(1800, { easing: Easing.out(Easing.quad), rest: 1 });
  return (
    <View style={{ width: size, height: size }}>
      <Animated.View
        style={{
          ...FILL,
          borderRadius: size / 2,
          backgroundColor: color,
          opacity: t.interpolate({ inputRange: [0, 1], outputRange: [0.7, 0] }),
          transform: [{ scale: t.interpolate({ inputRange: [0, 1], outputRange: [1, 2.8] }) }],
        }}
      />
      <View
        style={{
          ...FILL,
          borderRadius: size / 2,
          backgroundColor: color,
          borderWidth: 2,
          borderColor: '#FFFFFF',
          shadowColor: color,
          shadowOpacity: 1,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 0 },
        }}
      />
    </View>
  );
}

/** Indicador "ao vivo": verde pulsando quando a simulação roda, cinza parado quando pausa. */
export function LiveDot({ on }: { on: boolean }) {
  const c = on ? '#19C59A' : '#8BA3B8';
  const t = useLoop(1600, { easing: Easing.out(Easing.quad), rest: 1 });
  return (
    <View importantForAccessibility="no-hide-descendants" style={{ width: 12, height: 12 }}>
      {on ? (
        <Animated.View
          style={{
            ...FILL,
            borderRadius: 6,
            backgroundColor: c,
            opacity: t.interpolate({ inputRange: [0, 1], outputRange: [0.7, 0] }),
            transform: [{ scale: t.interpolate({ inputRange: [0, 1], outputRange: [1, 2.8] }) }],
          }}
        />
      ) : null}
      <View style={{ ...FILL, borderRadius: 6, backgroundColor: c }} />
    </View>
  );
}

export interface RadarPoint {
  code: string;
  /** Posição em % do radar. */
  x: number;
  y: number;
  glow: string;
}

/** Radar do painel do agente: anéis, cruz, varredura girando e os pontos pulsando. */
export function Radar({ points, size = 250 }: { points: RadarPoint[]; size?: number }) {
  const sweep = useLoop(4000);
  const rotate = sweep.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const r = size / 2;
  // A varredura do design é um gradiente cônico; aqui, uma fatia de 80° em 16 gomos que esmaecem.
  const wedges = useMemo(() => {
    const n = 16;
    const span = (80 / n) * (Math.PI / 180);
    return Array.from({ length: n }, (_, i) => {
      const a0 = -Math.PI / 2 - i * span;
      const a1 = a0 - span * 1.05;
      const p = (a: number) => `${r + r * Math.cos(a)} ${r + r * Math.sin(a)}`;
      return { d: `M${r} ${r} L${p(a0)} A${r} ${r} 0 0 0 ${p(a1)} Z`, o: 0.55 * (1 - i / n) };
    });
  }, [r]);

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel="Radar com os pontos monitorados"
      style={{ width: size, height: size, alignSelf: 'center', borderRadius: r, overflow: 'hidden', borderWidth: 1.5, borderColor: 'rgba(124,243,255,0.55)' }}
    >
      <Svg style={StyleSheet.absoluteFill} width={size} height={size}>
        <Defs>
          <RadialGradient id="radar" cx="0.5" cy="0.5" r="0.5">
            <Stop offset="0" stopColor="#0B5FA8" />
            <Stop offset="0.6" stopColor="#062F5C" />
            <Stop offset="1" stopColor="#041D3A" />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width={size} height={size} fill="url(#radar)" />
        <Ellipse cx={r} cy={r} rx={r * 0.33} ry={r * 0.33} stroke="rgba(124,243,255,0.28)" fill="none" />
        <Ellipse cx={r} cy={r} rx={r * 0.66} ry={r * 0.66} stroke="rgba(124,243,255,0.28)" fill="none" />
        <Line x1={r} y1={0} x2={r} y2={size} stroke="rgba(124,243,255,0.22)" />
        <Line x1={0} y1={r} x2={size} y2={r} stroke="rgba(124,243,255,0.22)" />
      </Svg>
      <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ rotate }] }]}>
        <Svg width={size} height={size}>
          {wedges.map((w, i) => (
            <Path key={i} d={w.d} fill="#00E5FF" fillOpacity={w.o} />
          ))}
        </Svg>
      </Animated.View>
      {points.map((p) => (
        <View
          key={p.code}
          style={{ position: 'absolute', left: (size * p.x) / 100 - 40, top: (size * p.y) / 100 - 8, width: 80, alignItems: 'center', gap: 4 }}
        >
          <PingDot color={p.glow} />
          <AppText
            font="display"
            weight={600}
            size={14}
            lh={1.2}
            color="#FFFFFF"
            allowFontScaling={false}
            style={{ textShadowColor: 'rgba(0,0,0,0.7)', textShadowRadius: 4, textShadowOffset: { width: 0, height: 1 } }}
          >
            {p.code}
          </AppText>
        </View>
      ))}
    </View>
  );
}


import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { G, Line, Path, Polygon, Rect } from 'react-native-svg';
import { useTheme } from '@/contexts/SettingsContext';
import { LIMITS } from '@/services/iot/thresholds';
import { hero } from '@/styles/theme';
import { AppText } from './AppText';
import { Icon } from './Icon';

/** Altura do hero da tela inicial. */
export const HERO_H = 430;
/** Chão da cena (px acima da base do hero) e escala da água (px por cm). */
const G0 = 62;
const PXC = 0.62;
/** Altura da faixa de onda e o meio dela (onde fica o nível "de verdade"). */
const WAVE_H = 28;
const WAVE_MEAN = 14;
const MAX_CM = 130;
const RISE = Easing.bezier(0.3, 0.7, 0.3, 1);

const fmtN = (n: number) => String(n).replace('.', ',');

/** Profundidade em linguagem do dia a dia (referência: pessoa de 1,70 m). */
export function depthOf(n: number): string {
  if (n < 15) return 'Abaixo da calçada';
  if (n < 45) return 'Abaixo do joelho';
  if (n < 60) return 'Na altura do joelho';
  if (n < 95) return 'Acima do joelho';
  return 'Na altura da cintura';
}

/** 0 → 1 em loop contínuo (parado com "Reduzir movimento"). */
function useLoopValue(durationMs: number, delayMs = 0, easing = Easing.linear) {
  const { reduceMotion } = useTheme();
  const t = useSharedValue(0);
  useEffect(() => {
    if (reduceMotion) {
      cancelAnimation(t);
      t.value = 0;
      return;
    }
    t.value = 0;
    t.value = withDelay(delayMs, withRepeat(withTiming(1, { duration: durationMs, easing }), -1, false));
    return () => cancelAnimation(t);
  }, [reduceMotion, durationMs, delayMs, easing, t]);
  return t;
}

/** Uma faixa de onda (mesmo desenho do design), em largura `w`. */
function WaveShape({ w, fill }: { w: number; fill: string }) {
  return (
    <Svg width={w} height={WAVE_H} viewBox="0 0 100 20" preserveAspectRatio="none">
      <Path d="M0 10 Q 12.5 2 25 10 T 50 10 T 75 10 T 100 10 V20 H0 Z" fill={fill} />
    </Svg>
  );
}

/**
 * Camada de água: uma faixa de onda que rola para o lado e um bloco de cor embaixo.
 * A altura muda só por translateY (sem relayout), com a curva de 1,2 s do design.
 */
function WaterLayer({ width, height, color, durationMs, reverse }: { width: number; height: number; color: string; durationMs: number; reverse?: boolean }) {
  const { reduceMotion } = useTheme();
  const loop = useLoopValue(durationMs);
  const top = useSharedValue(HERO_H - height - WAVE_H);

  useEffect(() => {
    const target = HERO_H - height - WAVE_H;
    top.value = reduceMotion ? target : withTiming(target, { duration: 1200, easing: RISE });
  }, [height, reduceMotion, top]);

  const layerStyle = useAnimatedStyle(() => ({ transform: [{ translateY: top.value }] }));
  const waveStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: reverse ? -width + loop.value * width : -loop.value * width }],
  }));

  return (
    <Animated.View pointerEvents="none" style={[styles.layer, layerStyle]}>
      <Animated.View style={[{ flexDirection: 'row', width: width * 2, height: WAVE_H }, waveStyle]}>
        <WaveShape w={width} fill={color} />
        <WaveShape w={width} fill={color} />
      </Animated.View>
      <View style={{ flex: 1, backgroundColor: color }} />
    </Animated.View>
  );
}

/** aqDrop: gota inclinada que cai. */
function Drop({ left, durationMs, delayMs }: { left: number; durationMs: number; delayMs: number }) {
  const t = useLoopValue(durationMs, delayMs);
  const style = useAnimatedStyle(() => {
    const v = t.value;
    const opacity = v === 0 ? 0 : v < 0.15 ? (v / 0.15) * 0.8 : 0.8 - ((v - 0.15) / 0.85) * 0.6;
    return { opacity, transform: [{ translateY: -30 + v * 250 }, { rotate: '12deg' }] };
  });
  return (
    <Animated.View style={[{ position: 'absolute', top: 0, left: `${left}%`, width: 1.5, height: 14 }, style]}>
      <LinearGradient colors={['rgba(154,246,255,0)', 'rgba(154,246,255,0.9)']} style={{ flex: 1 }} />
    </Animated.View>
  );
}

type Win = [x: number, y: number, w: number, h: number, lit: boolean];

/** Janelas: algumas acesas. */
const WINDOWS: Win[] = [
  ...[52, 80, 108, 136].flatMap((y, r) =>
    [17, 40, 63].map((x, c): Win => [x, y, 16, 20, (r === 1 && c === 1) || (r === 2 && c === 2) || (r === 3 && c === 0)]),
  ),
  [106, 112, 16, 18, false],
  [148, 112, 16, 18, true],
  [309, 136, 14, 14, true],
  [335, 136, 14, 14, false],
  [376, 92, 12, 14, false],
  [376, 118, 12, 14, true],
  [376, 144, 12, 14, false],
];

function Windows({ lit }: { lit: boolean }) {
  return (
    <>
      {WINDOWS.filter((w) => w[4] === lit).map(([x, y, w, h]) => (
        <Rect
          key={`${x}-${y}`}
          x={x}
          y={y}
          width={w}
          height={h}
          rx={1.5}
          fill={lit ? hero.windowLit : 'rgba(255,255,255,0.08)'}
          stroke={hero.strokeSoft}
          strokeWidth={1}
        />
      ))}
    </>
  );
}

const SKY_W = 390;
const SKY_H = 190;

/** Prédios e casas em contorno branco, com as janelas acesas pulsando (aqGlow). */
function Skyline() {
  const { reduceMotion } = useTheme();
  const glow = useSharedValue(1);
  useEffect(() => {
    if (reduceMotion) {
      glow.value = 1;
      return;
    }
    const half = { duration: 1700, easing: Easing.inOut(Easing.ease) };
    glow.value = withRepeat(withSequence(withTiming(0.55, half), withTiming(1, half)), -1, false);
    return () => cancelAnimation(glow);
  }, [reduceMotion, glow]);
  const litStyle = useAnimatedStyle(() => ({ opacity: glow.value }));

  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, bottom: G0, height: SKY_H }}>
      <Svg width="100%" height={SKY_H} viewBox={`0 0 ${SKY_W} ${SKY_H}`}>
        {/* Prédio ao fundo, mais apagado */}
        <G fill="rgba(160,220,255,0.05)" stroke="rgba(255,255,255,0.3)" strokeWidth={1.25}>
          <Rect x={176} y={106} width={120} height={84} />
          {[188, 212, 236, 260].map((x) => (
            <Rect key={`a${x}`} x={x} y={120} width={14} height={16} fill="none" />
          ))}
          {[188, 212, 236, 260].map((x) => (
            <Rect key={`b${x}`} x={x} y={150} width={14} height={16} fill="none" />
          ))}
        </G>
        <G fill="rgba(160,220,255,0.10)" stroke={hero.stroke} strokeWidth={1.5} strokeLinejoin="round">
          <Rect x={8} y={40} width={78} height={150} />
          <Rect x={36} y={160} width={22} height={30} />
          <Rect x={150} y={68} width={10} height={20} />
          <Rect x={98} y={98} width={74} height={92} />
          <Polygon points="92,100 135,62 178,100" />
          <Rect x={125} y={144} width={20} height={46} />
          <Rect x={300} y={122} width={58} height={68} />
          <Polygon points="294,124 329,92 364,124" />
          <Rect x={321} y={156} width={16} height={34} />
          <Rect x={368} y={78} width={40} height={112} />
        </G>
        <Windows lit={false} />
      </Svg>
      <Animated.View style={[StyleSheet.absoluteFill, litStyle]}>
        <Svg width="100%" height={SKY_H} viewBox={`0 0 ${SKY_W} ${SKY_H}`}>
          <Windows lit />
        </Svg>
      </Animated.View>
    </View>
  );
}

const TICKS: [number, string, 'left' | 'right'][] = [
  [LIMITS.atencao, hero.ticks.atencao, 'right'],
  [LIMITS.alerta, hero.ticks.alerta, 'left'],
  [LIMITS.critico, hero.ticks.critico, 'right'],
];

/**
 * Cena do hero da tela inicial: chuva, prédios e casas, uma pessoa de 1,70 m
 * para dar escala, as marcas de 20/40/70 cm e três camadas de onda que sobem e
 * descem com o nível. A última onda tem a cor do fundo e faz a divisão com o conteúdo.
 */
export function LevelScene({ level, rain }: { level: number; rain: number }) {
  const { palette } = useTheme();
  const [width, setWidth] = useState(0);
  const L = Math.max(0, Math.min(level, MAX_CM));
  const wh = G0 + L * PXC;
  const drops = Math.min(26, Math.round(rain * 1.2));

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={`Ilustração da rua com casas e uma pessoa de 1,70 m. A água está em ${fmtN(level)} centímetros: ${depthOf(level).toLowerCase()}.`}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]}
    >
      <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 150, height: 220, overflow: 'hidden' }}>
        {Array.from({ length: drops }, (_, i) => (
          <Drop key={i} left={(i * 37) % 100} durationMs={800 + (i % 5) * 120} delayMs={((i * 0.13) % 1) * 1000} />
        ))}
      </View>

      <Skyline />

      {TICKS.map(([v, c, side]) => (
        <View key={v} pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, bottom: G0 + v * PXC, height: 2, opacity: 0.85 }}>
          <Svg width="100%" height={2}>
            <Line x1="0" y1="1" x2="100%" y2="1" stroke={c} strokeWidth={1.5} strokeDasharray="5 4" />
          </Svg>
          <AppText
            font="display"
            weight={700}
            size={14}
            lh={1.2}
            color={c}
            allowFontScaling={false}
            style={[styles.tickLabel, side === 'left' ? { left: 8 } : { right: 8 }]}
          >
            {`${v} cm`}
          </AppText>
        </View>
      ))}

      <View pointerEvents="none" style={{ position: 'absolute', left: '60%', marginLeft: -62, width: 124, bottom: G0 - 10, alignItems: 'center' }}>
        <Icon name="man" filled size={125} color={hero.person} />
      </View>
      <View pointerEvents="none" style={{ position: 'absolute', left: '60%', marginLeft: -40, width: 80, bottom: G0 + 170 * PXC + 6 }}>
        <AppText font="display" weight={700} size={14} lh={1.2} color={hero.person} align="center" allowFontScaling={false}>
          1,70 m
        </AppText>
      </View>

      {width > 0 ? (
        <>
          <WaterLayer width={width} height={Math.round(wh - WAVE_MEAN + 10)} color={hero.waveDeep} durationMs={9000} reverse />
          <WaterLayer width={width} height={Math.round(wh - WAVE_MEAN)} color={hero.waveLight} durationMs={6000} />
          <WaterLayer width={width} height={Math.round(wh - WAVE_MEAN - 26)} color={palette.bg} durationMs={4000} />
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  layer: { position: 'absolute', left: 0, right: 0, top: 0, height: HERO_H + WAVE_H },
  tickLabel: {
    position: 'absolute',
    top: -19,
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowRadius: 3,
    textShadowOffset: { width: 0, height: 1 },
  },
});

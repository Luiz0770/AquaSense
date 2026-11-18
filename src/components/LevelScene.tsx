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
import Svg, { Defs, G, Line, LinearGradient as SvgLinearGradient, Mask, Path, Polygon, Rect, Stop } from 'react-native-svg';
import { useTheme } from '@/contexts/SettingsContext';
import { LIMITS } from '@/services/iot/thresholds';
import { hero } from '@/styles/theme';
import { AppText } from './AppText';
import { Icon } from './Icon';

/** Altura do hero da tela inicial. */
export const HERO_H = 430;
/**
 * Escala real da cena, igual para tudo: 1 cm = 0,5 px.
 * Pessoa 1,70 m = 85 px · porta 2,10 m = 105 px · parede da casa 2,80 m = 140 px ·
 * peitoril da janela a 1 m = 50 px · água a 20 cm = 10 px.
 */
const PXC = 0.5;
/** Chão da cena: px acima da base do hero. Abaixo dele fica a faixa branca (cor do fundo). */
const G0 = 62;
const MAX_CM = 130;
/** A pessoa de 1,70 m usa o ícone em 102 px (o desenho ocupa ~83% disso = 85 px); o gap faz os pés tocarem o chão. */
const PERSON_H = 102;
const PERSON_FOOT_GAP = 8;
const RISE = Easing.bezier(0.3, 0.7, 0.3, 1);

/** Faixa onde a linha d'água é desenhada (a linha fica no meio) e o quanto a ondulação sobe e desce. */
const LINE_H = 12;
const LINE_AMP = 2.4;

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

/** Um trecho da linha d'água em largura `w`: 2 ondas suaves (pico de ~1,2 px), emendando sem corte. */
function Ripple({ w, color, glow }: { w: number; color: string; glow: boolean }) {
  const seg = w / 4;
  const mid = LINE_H / 2;
  const d = `M0 ${mid} Q ${seg / 2} ${mid - LINE_AMP} ${seg} ${mid} T ${seg * 2} ${mid} T ${seg * 3} ${mid} T ${w} ${mid}`;
  return (
    <Svg width={w} height={LINE_H}>
      {glow ? <Path d={d} fill="none" stroke={color} strokeWidth={7} strokeOpacity={0.22} strokeLinecap="round" /> : null}
      <Path d={d} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

/** A linha d'água: o trecho se repete e rola para o lado (aqWave). */
function WaterLine({ width, color, durationMs, reverse, opacity = 1, glow = false }: { width: number; color: string; durationMs: number; reverse?: boolean; opacity?: number; glow?: boolean }) {
  const loop = useLoopValue(durationMs);
  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: reverse ? -width + loop.value * width : -loop.value * width }],
  }));
  return (
    <Animated.View
      pointerEvents="none"
      style={[{ position: 'absolute', top: -LINE_H / 2, left: 0, flexDirection: 'row', width: width * 2, height: LINE_H, opacity }, style]}
    >
      <Ripple w={width} color={color} glow={glow} />
      <Ripple w={width} color={color} glow={glow} />
    </Animated.View>
  );
}

/**
 * A água: um bloco azul translúcido cuja altura é exatamente nivel × 0,5 px, com a linha d'água
 * no topo (o centro da linha é o nível medido). Sobe e desce em 1,2 s com a curva do design.
 */
function Water({ width, level }: { width: number; level: number }) {
  const { reduceMotion } = useTheme();
  const target = level * PXC;
  const h = useSharedValue(target);

  useEffect(() => {
    h.value = reduceMotion ? target : withTiming(target, { duration: 1200, easing: RISE });
  }, [target, reduceMotion, h]);

  const style = useAnimatedStyle(() => ({ height: h.value }));

  return (
    <Animated.View pointerEvents="none" style={[styles.water, style]}>
      <LinearGradient colors={['rgba(56,190,255,0.34)', 'rgba(0,102,224,0.5)']} style={StyleSheet.absoluteFill} />
      <WaterLine width={width} color="#9AF6FF" durationMs={7000} reverse opacity={0.5} />
      <WaterLine width={width} color="#38D6FF" durationMs={4500} glow />
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

const SKY_W = 390;
const SKY_H = 200;
/** Altura (px, de cima para baixo) de uma medida em cm contada a partir do chão. */
const cmY = (cm: number) => SKY_H - cm * PXC;

type Win = [x: number, y: number, w: number, h: number, lit: boolean];

/** Janelas em escala real: algumas acesas. */
const WINDOWS: Win[] = [
  [10, cmY(220), 34, 120 * PXC, false],
  [10, -14, 34, 50, true],
  [58, -14, 34, 50, false],
  [132, cmY(210), 60, 110 * PXC, true],
  [332, cmY(190), 34, 90 * PXC, true],
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

/** Esmaece os 20% de cima da cena (prédios somem no topo, sem competir com o texto do hero). */
function SkyFade({ id }: { id: string }) {
  return (
    <Defs>
      <SvgLinearGradient id={`${id}-grad`} x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0} />
        <Stop offset="0.2" stopColor="#FFFFFF" stopOpacity={1} />
        <Stop offset="1" stopColor="#FFFFFF" stopOpacity={1} />
      </SvgLinearGradient>
      <Mask id={id} x="0" y="0" width={SKY_W} height={SKY_H} maskUnits="userSpaceOnUse">
        <Rect x={0} y={0} width={SKY_W} height={SKY_H} fill={`url(#${id}-grad)`} />
      </Mask>
    </Defs>
  );
}

const DOOR = 'rgba(4,29,58,0.45)';

/** Casas e prédio em contorno branco, em escala real, com as janelas acesas pulsando (aqGlow). */
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
        <SkyFade id="skyA" />
        <G mask="url(#skyA)">
          {/* Prédio ao fundo, mais apagado */}
          <G fill="rgba(160,220,255,0.05)" stroke="rgba(255,255,255,0.3)" strokeWidth={1.25}>
            <Rect x={300} y={6} width={74} height={SKY_H - 6} />
            {[16, 46, 76].flatMap((y) =>
              [312, 340].map((x) => <Rect key={`f${x}-${y}`} x={x} y={y} width={18} height={18} fill="none" />),
            )}
          </G>
          <G fill="rgba(160,220,255,0.10)" stroke={hero.stroke} strokeWidth={1.5} strokeLinejoin="round">
            {/* Casa da esquerda: 2 andares (laje a 3 m) e porta de 2,10 m */}
            <Rect x={-2} y={-10} width={106} height={SKY_H + 10} />
            <Line x1={-2} y1={cmY(300)} x2={104} y2={cmY(300)} />
            <Rect x={54} y={cmY(210)} width={45} height={210 * PXC} fill={DOOR} />
            {/* Casa do meio: parede de 2,80 m, telhado e porta de 2,10 m */}
            <Polygon points={`108,${cmY(280) + 2} 211,${cmY(280) - 34} 314,${cmY(280) + 2}`} />
            <Rect x={116} y={cmY(280)} width={190} height={280 * PXC} />
            <Rect x={258} y={cmY(210)} width={40} height={210 * PXC} fill={DOOR} />
            {/* Casa da direita: 2,40 m */}
            <Rect x={318} y={cmY(240)} width={84} height={240 * PXC} />
          </G>
          <Windows lit={false} />
        </G>
      </Svg>
      <Animated.View style={[StyleSheet.absoluteFill, litStyle]}>
        <Svg width="100%" height={SKY_H} viewBox={`0 0 ${SKY_W} ${SKY_H}`}>
          <SkyFade id="skyB" />
          <G mask="url(#skyB)">
            <Windows lit />
          </G>
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
 * Cena do hero da tela inicial: chuva, casas em escala real, uma pessoa de 1,70 m para dar
 * escala, as marcas de 20/40/70 cm e a água, que é um bloco com uma linha fina no topo.
 * Tudo usa 1 cm = 0,5 px, então a linha d'água fica exatamente no nível medido.
 * Abaixo do chão fica a faixa com a cor do fundo, que divide o hero do conteúdo.
 */
export function LevelScene({ level, rain }: { level: number; rain: number }) {
  const { palette } = useTheme();
  const [width, setWidth] = useState(0);
  const L = Math.max(0, Math.min(level, MAX_CM));
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

      <View
        pointerEvents="none"
        style={{ position: 'absolute', left: '60%', marginLeft: -PERSON_H / 2, width: PERSON_H, bottom: G0 - PERSON_FOOT_GAP, alignItems: 'center' }}
      >
        <Icon name="man" filled size={PERSON_H} color={hero.person} />
      </View>
      <View pointerEvents="none" style={{ position: 'absolute', left: '60%', marginLeft: -40, width: 80, bottom: G0 + 170 * PXC + 6 }}>
        <AppText font="display" weight={700} size={14} lh={1.2} color={hero.person} align="center" allowFontScaling={false}>
          1,70 m
        </AppText>
      </View>

      {width > 0 ? <Water width={width} level={L} /> : null}

      <View pointerEvents="none" style={[styles.ground, { backgroundColor: palette.bg }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  water: { position: 'absolute', left: 0, right: 0, bottom: G0 },
  ground: { position: 'absolute', left: 0, right: 0, bottom: 0, height: G0 },
  tickLabel: {
    position: 'absolute',
    top: -19,
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowRadius: 3,
    textShadowOffset: { width: 0, height: 1 },
  },
});

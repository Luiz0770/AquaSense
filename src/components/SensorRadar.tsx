import React, { useMemo } from 'react';
import { Animated, Easing, Pressable, View } from 'react-native';
import Svg, { Circle, ClipPath, Defs, G, Line, Path, RadialGradient, Stop, Text as SvgText } from 'react-native-svg';
import { levelStyle } from '@/styles/theme';
import type { Level } from '@/types';
import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';
import { useLoop } from './motion';

const fmtN = (n: number) => String(n).replace('.', ',');

export interface SensorRadarPoint {
  id: string;
  num: number;
  nome: string;
  /** Posição em % do radar. */
  x: number;
  y: number;
  level: Level;
  nivelCm: number;
  trendIcon: IconName;
  /** Ex.: "Subindo · Ao vivo (ESP32)". */
  estado: string;
}

/** Anel de pulso do ponto (aqPing do design). */
function Pulse({ color }: { color: string }) {
  const t = useLoop(1800, { easing: Easing.out(Easing.quad), rest: 1 });
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: 8,
        top: 8,
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: color,
        opacity: t.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] }),
        transform: [{ scale: t.interpolate({ inputRange: [0, 1], outputRange: [1, 2.8] }) }],
      }}
    />
  );
}

/**
 * Radar da região (RadarPro do design), desenhado num único SVG de S × S:
 * halo, fundo radial, ruas e rio recortados no círculo, anéis de 500 m / 1 km / 1,5 km,
 * cruz, marcas de 5 em 5 graus, rosa dos ventos, varredura girando, centro e um botão
 * numerado por sensor. Tocar num sensor mostra os valores dele num cartão dentro do radar.
 */
export function SensorRadar({
  points,
  selectedId,
  onSelect,
  onOpen,
  size = 300,
}: {
  points: SensorRadarPoint[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onOpen: (id: string) => void;
  size?: number;
}) {
  const S = size;
  const k = S / 300; // o design é de 300 px; tudo escala junto
  const C = S / 2;
  const R = 122 * k;
  const sweep = useLoop(5000);
  const rotate = sweep.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const sel = points.find((p) => p.id === selectedId) ?? null;

  const ticks = useMemo(
    () =>
      Array.from({ length: 72 }, (_, i) => {
        const a = (i * 5 * Math.PI) / 180;
        const big = i % 6 === 0;
        const l = (big ? 9 : 4) * k;
        return { x1: C + Math.sin(a) * R, y1: C - Math.cos(a) * R, x2: C + Math.sin(a) * (R - l), y2: C - Math.cos(a) * (R - l), big };
      }),
    [C, R, k],
  );

  // A varredura do design é um conic-gradient (0,42 → 0 em 18% da volta); aqui, 16 fatias que esmaecem.
  const wedges = useMemo(() => {
    const n = 16;
    const span = (0.18 * 2 * Math.PI) / n;
    return Array.from({ length: n }, (_, i) => {
      const a0 = -Math.PI / 2 - i * span;
      const a1 = a0 - span * 1.08;
      const p = (a: number) => `${(R + R * Math.cos(a)).toFixed(1)} ${(R + R * Math.sin(a)).toFixed(1)}`;
      return { d: `M${R} ${R} L${p(a0)} A${R} ${R} 0 0 0 ${p(a1)} Z`, o: 0.42 * (1 - i / n) };
    });
  }, [R]);

  const rings: [number, string][] = [
    [0.34, '500 m'],
    [0.67, '1 km'],
    [1, '1,5 km'],
  ];
  const compass: [string, number, number][] = [
    ['N', C, C - R - 12 * k],
    ['L', C + R + 13 * k, C],
    ['S', C, C + R + 13 * k],
    ['O', C - R - 13 * k, C],
  ];
  const s = (n: number) => n * k;

  return (
    <View
      style={{ width: S, height: S, alignSelf: 'center' }}
      accessibilityLabel={`Radar da região com ${points.length} sensores: ${points.map((p) => `${p.nome}, ${fmtN(p.nivelCm)} centímetros, ${levelStyle[p.level].label}`).join('; ')}.`}
    >
      <Svg width={S} height={S} viewBox={`0 0 ${S} ${S}`}>
        <Defs>
          <RadialGradient id="rdBg" cx={C} cy={C} r={R} fx={C} fy={C} gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor="#0E6CBF" />
            <Stop offset="0.62" stopColor="#063E73" />
            <Stop offset="1" stopColor="#041D3A" />
          </RadialGradient>
          <ClipPath id="rdClip">
            <Circle cx={C} cy={C} r={R} />
          </ClipPath>
        </Defs>
        <Circle cx={C} cy={C} r={R + s(7)} fill="none" stroke="rgba(124,243,255,0.12)" strokeWidth={s(8)} />
        {/* Cor sólida por baixo: se o gradiente falhar em algum aparelho, o radar continua visível. */}
        <Circle cx={C} cy={C} r={R} fill="#063E73" />
        <Circle cx={C} cy={C} r={R} fill="url(#rdBg)" stroke="rgba(124,243,255,0.65)" strokeWidth={1.5} />
        <G clipPath="url(#rdClip)">
          <Path d={`M${s(20)} ${s(205)} L${s(290)} ${s(120)}`} stroke="rgba(255,255,255,0.07)" strokeWidth={s(7)} fill="none" />
          <Path d={`M${s(95)} ${s(20)} L${s(180)} ${s(290)}`} stroke="rgba(255,255,255,0.07)" strokeWidth={s(7)} fill="none" />
          <Path d={`M${s(30)} ${s(95)} L${s(270)} ${s(230)}`} stroke="rgba(255,255,255,0.05)" strokeWidth={s(4)} fill="none" />
          <Path
            d={`M${C - R} ${C + s(70)} C ${s(80)} ${s(200)}, ${s(130)} ${s(120)}, ${s(190)} ${s(112)} S ${s(260)} ${s(60)}, ${C + R} ${s(52)}`}
            stroke="rgba(56,214,255,0.28)"
            strokeWidth={s(10)}
            strokeLinecap="round"
            fill="none"
          />
        </G>
        {rings.slice(0, 2).map(([f], i) => (
          <Circle key={`r${i}`} cx={C} cy={C} r={R * f} fill="none" stroke="rgba(124,243,255,0.3)" strokeWidth={1} strokeDasharray="3 5" />
        ))}
        <Line x1={C - R} y1={C} x2={C + R} y2={C} stroke="rgba(124,243,255,0.22)" strokeWidth={1} />
        <Line x1={C} y1={C - R} x2={C} y2={C + R} stroke="rgba(124,243,255,0.22)" strokeWidth={1} />
        {ticks.map((t, i) => (
          <Line key={`t${i}`} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} stroke={t.big ? 'rgba(124,243,255,0.75)' : 'rgba(124,243,255,0.35)'} strokeWidth={t.big ? 1.5 : 1} />
        ))}
        {rings.map(([f, label], i) => (
          <SvgText key={`l${i}`} x={C + s(5)} y={C - R * f + s(15)} fill="#BFE3FF" fontSize={s(12)}>
            {label}
          </SvgText>
        ))}
        {compass.map(([t, x, y]) => (
          <SvgText key={t} x={x} y={y + s(4)} textAnchor="middle" fill="#7CF3FF" fontSize={s(13)} fontWeight="700">
            {t}
          </SvgText>
        ))}
      </Svg>

      {/* Varredura girando (fatias dentro do raio, então não precisa recorte) */}
      <Animated.View pointerEvents="none" style={{ position: 'absolute', left: C - R, top: C - R, width: 2 * R, height: 2 * R, transform: [{ rotate }] }}>
        <Svg width={2 * R} height={2 * R}>
          {wedges.map((w, i) => (
            <Path key={i} d={w.d} fill="#00E5FF" fillOpacity={w.o} />
          ))}
        </Svg>
      </Animated.View>
      <View
        pointerEvents="none"
        style={{ position: 'absolute', left: C - 4, top: C - 4, width: 8, height: 8, borderRadius: 4, backgroundColor: '#7CF3FF', shadowColor: '#7CF3FF', shadowOpacity: 1, shadowRadius: 6, shadowOffset: { width: 0, height: 0 } }}
      />

      {points.map((p) => {
        const l = levelStyle[p.level];
        const on = p.id === selectedId;
        const d = on ? 28 : 24;
        return (
          <Pressable
            key={p.id}
            onPress={() => onSelect(on ? null : p.id)}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            accessibilityLabel={`${p.nome}: ${fmtN(p.nivelCm)} centímetros, ${l.label}. ${on ? 'Esconder' : 'Mostrar'} os valores no radar.`}
            style={{ position: 'absolute', left: (p.x / 100) * S - 22, top: (p.y / 100) * S - 22, width: 44, height: 44, alignItems: 'center', justifyContent: 'center', zIndex: on ? 3 : 2 }}
          >
            <Pulse color={l.glow} />
            <View
              style={{
                width: d,
                height: d,
                borderRadius: d / 2,
                backgroundColor: l.glow,
                borderWidth: on ? 3 : 2,
                borderColor: '#FFFFFF',
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: l.glow,
                shadowOpacity: 1,
                shadowRadius: 7,
                shadowOffset: { width: 0, height: 0 },
                elevation: 4,
              }}
            >
              <AppText font="display" weight={700} size={13} lh={1.1} color="#04274D" allowFontScaling={false}>
                {String(p.num)}
              </AppText>
            </View>
          </Pressable>
        );
      })}

      {sel
        ? (() => {
            const l = levelStyle[sel.level];
            const W = Math.min(178, S - 4);
            const H = 158;
            const x = (sel.x / 100) * S;
            const y = (sel.y / 100) * S;
            const left = Math.max(2, Math.min(S - W - 2, x - W / 2));
            const top = y > S / 2 ? y - H - 24 : y + 24;
            return (
              <View
                accessibilityLabel={`Valores do ${sel.nome}`}
                style={{
                  position: 'absolute',
                  left,
                  top,
                  width: W,
                  zIndex: 4,
                  elevation: 8,
                  paddingTop: 10,
                  paddingHorizontal: 12,
                  paddingBottom: 12,
                  borderRadius: 18,
                  backgroundColor: 'rgba(4,29,58,0.94)',
                  borderWidth: 1,
                  borderColor: 'rgba(124,243,255,0.45)',
                  gap: 6,
                  shadowColor: '#000',
                  shadowOpacity: 0.35,
                  shadowRadius: 15,
                  shadowOffset: { width: 0, height: 14 },
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: l.glow }} />
                  <AppText font="display" weight={700} size={15} color="#FFFFFF" style={{ flex: 1 }} allowFontScaling={false}>
                    {sel.nome}
                  </AppText>
                  <Pressable
                    onPress={() => onSelect(null)}
                    accessibilityRole="button"
                    accessibilityLabel={`Fechar os valores do ${sel.nome}`}
                    style={{ width: 36, height: 36, marginVertical: -6, marginRight: -6, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Icon name="close" size={20} color="#FFFFFF" />
                  </Pressable>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <AppText font="display" weight={700} size={28} lh={1.05} color="#FFFFFF" allowFontScaling={false}>
                    {fmtN(sel.nivelCm)}
                    <AppText font="display" weight={500} size={14} color="#BFE3FF" allowFontScaling={false}>
                      {' cm'}
                    </AppText>
                  </AppText>
                  <View style={{ paddingHorizontal: 8, paddingVertical: 1, borderRadius: 12, backgroundColor: l.bg }}>
                    <AppText size={14} weight={700} lh={1.3} color={l.fg} allowFontScaling={false}>
                      {l.label}
                    </AppText>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Icon name={sel.trendIcon} size={18} color="#D6ECFF" />
                  <AppText size={14} color="#D6ECFF" lh={1.25} numberOfLines={1} style={{ flexShrink: 1 }} allowFontScaling={false}>
                    {sel.estado}
                  </AppText>
                </View>
                <Pressable
                  onPress={() => onOpen(sel.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`Abrir ${sel.nome}`}
                  style={({ pressed }) => ({
                    minHeight: 40,
                    marginTop: 2,
                    borderRadius: 12,
                    backgroundColor: '#FFFFFF',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 4,
                    opacity: pressed ? 0.85 : 1,
                  })}
                >
                  <Icon name="sensors" size={18} color="#04274D" />
                  <AppText size={14} weight={700} color="#04274D" allowFontScaling={false}>
                    Abrir sensor
                  </AppText>
                </Pressable>
              </View>
            );
          })()
        : null}
    </View>
  );
}

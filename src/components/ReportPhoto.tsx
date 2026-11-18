import React, { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Svg, { Defs, Line, LinearGradient, Path, Polygon, Rect, Stop } from 'react-native-svg';
import type { Report } from '@/types';
import { AppText } from './AppText';
import { Icon } from './Icon';

type Fit = 'cover' | 'contain';

const WIN_A: [number, number][] = [[8, 48], [30, 48], [52, 48], [8, 76], [30, 76], [52, 76], [8, 104], [30, 104], [52, 104]];
const WIN_B: [number, number][] = [[184, 70], [206, 70], [184, 96], [206, 96]];
const SHINE: [number, number, number][] = [[20, 176, 60], [120, 182, 90], [220, 174, 70], [60, 190, 80], [200, 192, 100]];
const RAIN = Array.from({ length: 40 }, (_, i) => [(i * 41) % 330, (i * 23) % 140] as const);

/**
 * Foto de demonstração (rua com água acumulada e um carro parcialmente coberto).
 * Aparece nos relatos que só marcavam "com foto", de antes de o app guardar a imagem.
 */
function DemoPhoto({ id, fit }: { id: string; fit: Fit }) {
  const win = (x: number, y: number, lit: boolean, k: string) => (
    <Rect key={k} x={x} y={y} width={12} height={14} rx={1} fill={lit ? '#E8D9A8' : '#3B4D5C'} opacity={0.9} />
  );
  return (
    <Svg
      width="100%"
      height="100%"
      viewBox="0 0 320 200"
      preserveAspectRatio={`xMidYMid ${fit === 'cover' ? 'slice' : 'meet'}`}
      accessible
      accessibilityLabel="Foto de demonstração: rua com água acumulada em frente às casas e um carro parcialmente coberto"
    >
      <Defs>
        <LinearGradient id={`${id}s`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#56707F" />
          <Stop offset="1" stopColor="#A3B5C1" />
        </LinearGradient>
        <LinearGradient id={`${id}w`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#7894A3" />
          <Stop offset="1" stopColor="#2F4A5B" />
        </LinearGradient>
      </Defs>
      <Rect width={320} height={200} fill={`url(#${id}s)`} />
      <Rect x={-4} y={34} width={78} height={116} fill="#465A69" />
      {WIN_A.map(([x, y], i) => win(x, y, i === 4, `a${i}`))}
      <Polygon points="70,78 122,46 174,78" fill="#5A6E7D" />
      <Rect x={76} y={76} width={92} height={74} fill="#6F8392" />
      <Rect x={88} y={92} width={26} height={22} fill="#E8D9A8" opacity={0.85} />
      <Rect x={132} y={100} width={22} height={50} fill="#33424F" />
      <Rect x={174} y={58} width={58} height={92} fill="#55687A" />
      {WIN_B.map(([x, y], i) => win(x, y, i === 1, `b${i}`))}
      <Rect x={232} y={86} width={92} height={64} fill="#7A8D9B" />
      <Rect x={246} y={100} width={30} height={20} fill="#3B4D5C" />
      <Rect x={288} y={104} width={18} height={46} fill="#33424F" />
      <Rect x={226} y={40} width={3} height={112} fill="#2C3A45" />
      <Rect x={226} y={40} width={22} height={3} fill="#2C3A45" />
      <Rect x={0} y={146} width={320} height={6} fill="#8C9BA6" />
      <Path d="M40 170 Q 46 150 70 148 L 112 148 Q 132 150 140 170 Z" fill="#B4483F" />
      <Path d="M62 150 L 72 139 L 104 139 L 116 150 Z" fill="#9FB3C0" />
      <Path d="M0 152 Q 40 148 80 152 T 160 152 T 240 152 T 320 152 V200 H0 Z" fill={`url(#${id}w)`} opacity={0.9} />
      <Path d="M20 164 Q 90 158 150 164 T 300 164" stroke="rgba(255,255,255,0.35)" strokeWidth={1.5} fill="none" />
      {SHINE.map(([x, y, w], i) => (
        <Rect key={`r${i}`} x={x} y={y} width={w} height={1.5} rx={1} fill="rgba(255,255,255,0.28)" />
      ))}
      {RAIN.map(([x, y], i) => (
        <Line key={`c${i}`} x1={x} y1={y} x2={x - 4} y2={y + 14} stroke="rgba(255,255,255,0.35)" strokeWidth={1} />
      ))}
    </Svg>
  );
}

/**
 * Foto do relato ocupando todo o espaço do pai (que define o tamanho, ex.: aspectRatio 16/10).
 * Mostra a imagem real; se ela não abrir (o arquivo foi apagado do aparelho), avisa no lugar.
 * Relatos antigos, só com a marca "com foto", mostram a foto de demonstração.
 */
export function ReportPhoto({ report, fit = 'cover', id }: { report: Pick<Report, 'fotoUri' | 'comFoto'>; fit?: Fit; id: string }) {
  const [failed, setFailed] = useState(false);

  if (report.fotoUri && !failed) {
    return (
      <Image
        source={{ uri: report.fotoUri }}
        onError={() => setFailed(true)}
        resizeMode={fit}
        style={StyleSheet.absoluteFill}
        accessible
        accessibilityLabel="Foto enviada com o relato"
      />
    );
  }

  if (report.fotoUri && failed) {
    return (
      <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center', gap: 6, padding: 16 }]}>
        <Icon name="hide_image" size={36} color="#FFFFFF" />
        <AppText weight={700} color="#FFFFFF" align="center">
          Não foi possível abrir a foto
        </AppText>
        <AppText size={14} color="rgba(255,255,255,0.8)" align="center">
          O arquivo não está mais neste aparelho.
        </AppText>
      </View>
    );
  }

  return (
    <View style={StyleSheet.absoluteFill}>
      <DemoPhoto id={id} fit={fit} />
    </View>
  );
}

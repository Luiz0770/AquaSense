import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { useMonitoring } from '@/contexts/MonitoringContext';
import { useTheme } from '@/contexts/SettingsContext';
import { DEFAULT_SENSOR_ID, sensorById as sensorDef } from '@/data/sensors';
import { LEVEL_ORDER } from '@/services/iot/thresholds';
import { formatTime } from '@/utils/format';
import { cardShadow, gradients, hero, levelLabel, levelStyle, stage } from '@/styles/theme';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Sparkline } from '@/components/Charts';
import { DashedNote, LevelBadge, SectionTitle } from '@/components/Controls';
import { LiveDot } from '@/components/Hologram';
import { Icon } from '@/components/Icon';
import { Screen } from '@/components/Screen';
import { SensorRadar } from '@/components/SensorRadar';
import { sensorState } from '@/components/SensorPicker';
import { Gradient } from '@/components/Surfaces';

const fmtN = (n: number) => String(n).replace('.', ',');
const MAX_CARDS = 4;

export default function PainelScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { palette, fontScale } = useTheme();
  const { sensors, selectSensor, reports, alerts, liveCount } = useMonitoring();
  const [radarSel, setRadarSel] = useState<string | null>(null);
  const [all, setAll] = useState(false);
  const pendentes = reports.filter((r) => r.status === 'pendente').length;
  const running = sensors.filter((s) => s.running || s.source === 'esp32').length;

  // Pior primeiro: faixa mais grave, depois o nível mais alto.
  const ranked = useMemo(
    () => [...sensors].sort((a, b) => LEVEL_ORDER.indexOf(b.level) - LEVEL_ORDER.indexOf(a.level) || b.current.nivelCm - a.current.nivelCm),
    [sensors],
  );
  const worst = ranked[0];
  const cards = all ? ranked : ranked.slice(0, MAX_CARDS);
  const radarSize = Math.min(300, width - 48);

  const open = (id: string) => {
    selectSensor(id);
    router.push('/leituras');
  };

  return (
    <Screen notice hero>
      <View style={{ marginTop: -6, marginHorizontal: -16, overflow: 'hidden', paddingTop: 6, paddingBottom: 22, paddingHorizontal: 20, gap: 14 }}>
        <LinearGradient colors={hero.colors} locations={hero.locations} style={StyleSheet.absoluteFill} />
        <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 100 100">
          <Defs>
            <RadialGradient id="painelGlow" cx="0.5" cy="0.5" rx="0.75" ry="0.45" fx="0.5" fy="0.5">
              <Stop offset="0" stopColor={hero.glow} stopOpacity={1} />
              <Stop offset="0.7" stopColor={hero.glow} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Rect x="0" y="0" width="100" height="100" fill="url(#painelGlow)" />
        </Svg>

        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
          <View style={{ gap: 2, flexShrink: 1 }}>
            <AppText font="display" weight={700} size={22} lh={1.25} color="#FFFFFF" accessibilityRole="header">
              Painel de alertas
            </AppText>
            <AppText size={14} weight={700} color={stage.muted}>{`${sensors.length} sensores ultrassônicos`}</AppText>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 20, backgroundColor: hero.glassBg, borderWidth: 1, borderColor: hero.glassBorder }}>
            <LiveDot on={running > 0} />
            <AppText size={13} weight={700} color="#FFFFFF" lh={1.2}>
              {liveCount ? `${liveCount} ao vivo · ESP32` : running ? 'Simulado' : 'Pausado'}
            </AppText>
          </View>
        </View>

        <SensorRadar
          size={radarSize}
          selectedId={radarSel}
          onSelect={setRadarSel}
          onOpen={open}
          points={sensors.map((s) => ({
            id: s.id,
            num: s.def.num,
            nome: s.nome,
            x: s.def.x,
            y: s.def.y,
            level: s.level,
            nivelCm: s.current.nivelCm,
            trendIcon: s.trend.icon,
            estado: `${s.trend.label} · ${sensorState(s)}`,
          }))}
        />
        <AppText size={13} color={stage.muted} align="center">
          Toque num sensor do radar para ver os valores dele
        </AppText>

        <View style={{ flexDirection: 'row', gap: 8 }}>
          {[
            { k: 'Ao vivo', v: `${running}/${sensors.length}`, icon: 'sensors' as const },
            { k: 'Pior', v: worst ? `${worst.nome.replace('Sensor ', 'S')} · ${levelStyle[worst.level].label}` : '—', icon: 'warning' as const },
            { k: 'Chuva', v: `${fmtN(worst?.current.chuvaMm ?? 0)} mm/h`, icon: 'rainy' as const },
          ].map((st) => (
            <View key={st.k} style={{ flex: 1, padding: 10, borderRadius: 16, backgroundColor: hero.glassBg, borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)', gap: 4 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Icon name={st.icon} size={16 * fontScale} color={stage.cyan} />
                <AppText size={12} weight={700} color={stage.muted} lh={1.2}>
                  {st.k}
                </AppText>
              </View>
              <AppText font="display" weight={600} size={14} lh={1.25} color="#FFFFFF" numberOfLines={1}>
                {st.v}
              </AppText>
            </View>
          ))}
        </View>
      </View>

      <SectionTitle>Sensores · pior primeiro</SectionTitle>
      <View style={{ gap: 8 }}>
        {cards.map((s) => {
          const l = levelStyle[s.level];
          return (
            <Pressable
              key={s.id}
              onPress={() => open(s.id)}
              accessibilityRole="button"
              accessibilityLabel={`${s.nome}: ${l.label}, ${fmtN(s.current.nivelCm)} centímetros, ${s.trend.label}, ${sensorState(s)}. Abrir sensor.`}
              style={({ pressed }) => [
                { minHeight: 76, borderRadius: 22, borderWidth: 1, borderColor: palette.line, backgroundColor: palette.surface, flexDirection: 'row', alignItems: 'center', overflow: 'hidden' },
                cardShadow(palette),
                pressed && { transform: [{ scale: 0.98 }] },
              ]}
            >
              <View style={{ width: 5, alignSelf: 'stretch', backgroundColor: l.grad[1] }} />
              <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, paddingLeft: 12, paddingRight: 12 }}>
                <LevelBadge level={s.level} size={42} iconSize={24} radius={14} />
                <View style={{ flex: 1, gap: 2 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <AppText weight={700}>{s.nome}</AppText>
                    <View style={{ paddingHorizontal: 8, borderRadius: 10, backgroundColor: l.bg }}>
                      <AppText size={12} weight={700} lh={1.5} color={l.fg}>
                        {l.label}
                      </AppText>
                    </View>
                  </View>
                  <AppText size={13} muted>
                    {sensorState(s)}
                  </AppText>
                  <Sparkline data={s.readings.slice(0, 16).reverse().map((r) => r.nivelCm)} color={l.grad[1]} />
                </View>
                <View style={{ alignItems: 'flex-end', gap: 2 }}>
                  <AppText font="display" weight={700} size={20} lh={1.1}>{`${fmtN(s.current.nivelCm)}`}</AppText>
                  <AppText size={12} muted>
                    cm
                  </AppText>
                  <Icon name={s.trend.icon} size={20 * fontScale} color={palette.accent} />
                </View>
              </View>
            </Pressable>
          );
        })}
        {sensors.length > MAX_CARDS ? (
          <Button label={all ? 'Mostrar menos' : `Ver todos (${sensors.length})`} icon="list" variant="ghost" height={48} onPress={() => setAll((v) => !v)} />
        ) : null}
      </View>

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Pressable onPress={() => router.push('/relatos')} accessibilityRole="button" accessibilityLabel={`${pendentes} relatos para revisar`} style={{ flex: 1 }}>
          <Gradient colors={gradients.rain} style={{ minHeight: 100, padding: 14, borderRadius: 22, justifyContent: 'space-between' }}>
            <AppText font="display" size={32} lh={1} color="#FFFFFF">
              {String(pendentes)}
            </AppText>
            <AppText size={14} weight={700} color="#FFFFFF">
              Relatos para revisar
            </AppText>
          </Gradient>
        </Pressable>
        <Pressable onPress={() => router.push('/simulacao')} accessibilityRole="button" accessibilityLabel={`${running} de ${sensors.length} sensores ativos. Abrir simulação.`} style={{ flex: 1 }}>
          <Gradient colors={gradients.teal} style={{ minHeight: 100, padding: 14, borderRadius: 22, justifyContent: 'space-between' }}>
            <Icon name="tune" size={32 * fontScale} color="#FFFFFF" />
            <AppText size={14} weight={700} color="#FFFFFF">
              {`Simulação · ${running} de ${sensors.length} ativos`}
            </AppText>
          </Gradient>
        </Pressable>
      </View>

      <SectionTitle>Mudanças nos sensores</SectionTitle>
      {alerts.length === 0 ? (
        <DashedNote icon="hourglass_empty">Nenhuma mudança ainda. Escolha um cenário na aba Simular ou mude o nível no Node-RED.</DashedNote>
      ) : (
        alerts.slice(0, 8).map((a) => {
          const nome = sensorDef(a.sensorId ?? DEFAULT_SENSOR_ID).nome;
          return (
            <View
              key={a.id}
              accessible
              accessibilityLabel={`${nome}: ${a.mensagem} Às ${formatTime(a.timestamp)}.`}
              style={[
                { backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.line, borderRadius: 20, paddingVertical: 10, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
                cardShadow(palette, 0.06),
              ]}
            >
              <LevelBadge level={a.para} size={38} iconSize={22} radius={13} />
              <View style={{ flex: 1 }}>
                <AppText weight={700}>{`${nome}: ${levelLabel[a.de]} → ${levelLabel[a.para]}`}</AppText>
                <AppText size={14} muted>{`${fmtN(a.nivelCm)} cm · ${formatTime(a.timestamp)}`}</AppText>
              </View>
            </View>
          );
        })
      )}
    </Screen>
  );
}

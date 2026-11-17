import React from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useMonitoring } from '@/contexts/MonitoringContext';
import { useTheme } from '@/contexts/SettingsContext';
import { demoPoints, pilotRadar } from '@/data/network';
import { pilotPoint } from '@/data/pilotPoint';
import { SCENARIO_LABEL } from '@/services/iot/simulator';
import { levelFor } from '@/services/iot/thresholds';
import { formatTime } from '@/utils/format';
import { cardShadow, gradients, levelLabel, levelStyle, stage } from '@/styles/theme';
import { AppText } from '@/components/AppText';
import { DashedNote, LevelBadge, ScreenTitle, SectionTitle } from '@/components/Controls';
import { Radar } from '@/components/Hologram';
import { Icon } from '@/components/Icon';
import { Screen } from '@/components/Screen';
import { Gradient, StageCard } from '@/components/Surfaces';
import { SCENARIO_ICON } from '@/data/scenarios';

const fmtN = (n: number) => String(n).replace('.', ',');

export default function PainelScreen() {
  const router = useRouter();
  const { palette, fontScale } = useTheme();
  const { current, level, reports, alerts, scenario, sourceLabel } = useMonitoring();
  const pendentes = reports.filter((r) => r.status === 'pendente').length;

  const points = [
    { code: 'Piloto', name: pilotPoint.name, nivel: current.nivelCm, level, live: true },
    ...demoPoints.map((p) => ({ code: p.code, name: p.name, nivel: p.nivelCm, level: levelFor(p.nivelCm), live: false })),
  ];

  return (
    <Screen notice>
      <ScreenTitle>Painel de alertas</ScreenTitle>

      <StageCard vertical padding={18} style={{ gap: 14 }}>
        <Radar
          points={[
            { code: 'Piloto', x: pilotRadar.x, y: pilotRadar.y, glow: levelStyle[level].glow },
            ...demoPoints.map((p) => ({ code: p.code, x: p.x, y: p.y, glow: levelStyle[levelFor(p.nivelCm)].glow })),
          ]}
        />
        <AppText size={14} color={stage.muted} align="center">
          {`${points.length} pontos · ${pilotPoint.name} ao vivo (${sourceLabel})`}
        </AppText>
      </StageCard>

      <View style={{ gap: 8 }}>
        {points.map((p) => {
          const l = levelStyle[p.level];
          return (
            <Pressable
              key={p.code}
              onPress={() => router.push('/leituras')}
              disabled={!p.live}
              accessibilityRole={p.live ? 'button' : undefined}
              accessibilityLabel={`${p.name}: ${l.label}, ${fmtN(p.nivel)} centímetros${p.live ? '. Abrir sensor.' : ''}`}
              style={({ pressed }) => [
                { minHeight: 68, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 22, borderWidth: 1, borderColor: palette.line, backgroundColor: palette.surface, flexDirection: 'row', alignItems: 'center', gap: 12 },
                cardShadow(palette),
                pressed && { transform: [{ scale: 0.98 }] },
              ]}
            >
              <LevelBadge level={p.level} size={42} iconSize={24} radius={14} />
              <View style={{ flex: 1 }}>
                <AppText weight={700}>{p.name}</AppText>
                <AppText size={14} weight={700} color={palette.shadows ? l.fg : palette.ink}>{`${l.label} · ${fmtN(p.nivel)} cm`}</AppText>
              </View>
              {p.live ? <Icon name="chevron_right" size={24 * fontScale} color={palette.ink} /> : null}
            </Pressable>
          );
        })}
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
        <Pressable onPress={() => router.push('/simulacao')} accessibilityRole="button" accessibilityLabel={`Cenário: ${SCENARIO_LABEL[scenario]}. Abrir simulação.`} style={{ flex: 1 }}>
          <Gradient colors={gradients.teal} style={{ minHeight: 100, padding: 14, borderRadius: 22, justifyContent: 'space-between' }}>
            <Icon name={SCENARIO_ICON[scenario]} size={32 * fontScale} color="#FFFFFF" />
            <AppText size={14} weight={700} color="#FFFFFF">
              {`Cenário: ${SCENARIO_LABEL[scenario]}`}
            </AppText>
          </Gradient>
        </Pressable>
      </View>

      <SectionTitle>{`Mudanças no ${pilotPoint.name}`}</SectionTitle>
      {alerts.length === 0 ? (
        <DashedNote icon="hourglass_empty">Nenhuma mudança ainda. Escolha um cenário na aba Simular.</DashedNote>
      ) : (
        alerts.slice(0, 8).map((a) => {
          return (
            <View
              key={a.id}
              accessible
              accessibilityLabel={`${a.mensagem} Às ${formatTime(a.timestamp)}.`}
              style={[
                { backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.line, borderRadius: 20, paddingVertical: 10, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
                cardShadow(palette, 0.06),
              ]}
            >
              <LevelBadge level={a.para} size={38} iconSize={22} radius={13} />
              <View style={{ flex: 1 }}>
                <AppText weight={700}>{`${levelLabel[a.de]} → ${levelLabel[a.para]}`}</AppText>
                <AppText size={14} muted>{`${fmtN(a.nivelCm)} cm · ${formatTime(a.timestamp)}`}</AppText>
              </View>
            </View>
          );
        })
      )}
    </Screen>
  );
}

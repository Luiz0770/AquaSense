import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useTheme } from '@/contexts/SettingsContext';
import { floodEvents, history, type HistoryPeriod } from '@/data/history';
import { levelFor, LIMITS } from '@/services/iot/thresholds';
import { chart, gradients, levelStyle } from '@/styles/theme';
import { AppText } from '@/components/AppText';
import { BarChart } from '@/components/Charts';
import { ScreenTitle, SectionTitle, Segmented } from '@/components/Controls';
import { Icon } from '@/components/Icon';
import { Screen } from '@/components/Screen';
import { Card, Gradient } from '@/components/Surfaces';

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <View style={{ width: 12, height: 12, borderRadius: 4, backgroundColor: color }} />
      <AppText weight={700}>{label}</AppText>
    </View>
  );
}

export default function HistoricoScreen() {
  const { palette, fontScale } = useTheme();
  const [period, setPeriod] = useState<HistoryPeriod>('7d');
  const h = history[period];
  const total = h.rain.reduce((a, b) => a + b, 0);
  const peak = Math.max(...h.level);
  const rmax = Math.max(...h.rain) * 1.1;

  return (
    <Screen notice>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingHorizontal: 4, flexWrap: 'wrap' }}>
        <ScreenTitle>Histórico</ScreenTitle>
        <Segmented<HistoryPeriod>
          label="Período"
          stretch={false}
          value={period}
          onChange={setPeriod}
          options={[
            { value: '7d', label: '7 dias' },
            { value: '24h', label: '24 h' },
          ]}
        />
      </View>

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Gradient colors={gradients.rain} style={{ flex: 1, padding: 14, borderRadius: 22, gap: 4 }}>
          <Icon name="rainy" size={28 * fontScale} color="#FFFFFF" />
          <AppText font="display" size={26} lh={1.1} color="#FFFFFF">
            {`${total} `}
            <AppText font="display" size={13} color="#FFFFFF">
              mm
            </AppText>
          </AppText>
          <AppText size={14} color="#FFFFFF">
            Chuva no período
          </AppText>
        </Gradient>
        <Gradient colors={gradients.teal} style={{ flex: 1, padding: 14, borderRadius: 22, gap: 4 }}>
          <Icon name="water" size={28 * fontScale} color="#FFFFFF" />
          <AppText font="display" size={26} lh={1.1} color="#FFFFFF">
            {`${peak} `}
            <AppText font="display" size={13} color="#FFFFFF">
              cm
            </AppText>
          </AppText>
          <AppText size={14} color="#FFFFFF">
            Nível máximo
          </AppText>
        </Gradient>
      </View>

      <Card>
        <Legend color={chart.rain} label="Chuva (mm)" />
        <BarChart values={h.rain} labels={h.labels} max={rmax} colors={gradients.rainBar} unit="mm" />
      </Card>

      <Card>
        <Legend color={chart.level} label="Nível da água (cm)" />
        <BarChart
          values={h.level}
          labels={h.labels}
          max={100}
          colors={gradients.levelBar}
          unit="cm"
          thresholds={[
            [LIMITS.atencao, chart.thresholds.atencao],
            [LIMITS.alerta, chart.thresholds.alerta],
            [LIMITS.critico, chart.thresholds.critico],
          ]}
        />
      </Card>

      <SectionTitle>Alagamentos registrados</SectionTitle>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -16 }} contentContainerStyle={{ gap: 10, paddingHorizontal: 16, paddingTop: 2, paddingBottom: 8 }}>
        {floodEvents.map((e) => {
          const l = levelStyle[levelFor(e.nivel)];
          return (
            <View
              key={e.id}
              accessible
              accessibilityLabel={`${e.dia} de ${e.mes}: ${l.label}, ${e.nivel} centímetros`}
              style={{ width: 128 * Math.min(fontScale, 1.15), padding: 12, borderRadius: 20, backgroundColor: l.bg, borderWidth: 2, borderColor: l.fg, gap: 6 }}
            >
              <Icon name={l.icon} filled size={28 * fontScale} color={l.fg} />
              <AppText font="display" weight={700} color={l.fg}>
                {l.label}
              </AppText>
              <AppText size={14} color={palette.ink}>{`${e.dia} ${e.mes} · ${e.nivel} cm`}</AppText>
            </View>
          );
        })}
      </ScrollView>
      <AppText size={14} muted style={{ paddingHorizontal: 4 }}>
        Dados de demonstração.
      </AppText>
    </Screen>
  );
}

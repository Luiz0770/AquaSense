import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useMonitoring } from '@/contexts/MonitoringContext';
import { useTheme } from '@/contexts/SettingsContext';
import { READING_INTERVAL_MS } from '@/services/iot/simulator';
import { levelFor, LIMITS } from '@/services/iot/thresholds';
import { formatTime } from '@/utils/format';
import { chart, gradients, levelStyle, stage } from '@/styles/theme';
import { AppText } from '@/components/AppText';
import { AreaChart } from '@/components/Charts';
import { IconBadge, JsonBlock, RiskChip } from '@/components/Controls';
import { Holo, LiveDot } from '@/components/Hologram';
import { Icon } from '@/components/Icon';
import { Screen } from '@/components/Screen';
import { Card, StageCard } from '@/components/Surfaces';

const fmtN = (n: number) => String(n).replace('.', ',');
const POINTS = 24;

/** Sensor ao vivo: holograma grande, gráficos das últimas leituras e o JSON bruto do ESP32. */
export function SensorScreen() {
  const { palette, fontScale } = useTheme();
  const { current, level, readings, running } = useMonitoring();
  const [raw, setRaw] = useState(false);
  // As leituras vêm da mais nova para a mais antiga; o gráfico vai da mais antiga para agora.
  const recent = readings.slice(0, POINTS).reverse();
  const span = Math.round(((recent.length - 1) * READING_INTERVAL_MS) / 1000);
  const { id: _id, ...json } = current;

  return (
    <Screen notice>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 4 }}>
        <IconBadge icon="memory" colors={gradients.sensor} size={48} iconSize={28} radius={16} />
        <View style={{ flex: 1 }}>
          <AppText font="display" size={20} color={palette.navy} lh={1.25} accessibilityRole="header">
            {`Sensor ${current.sensorId}`}
          </AppText>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <LiveDot on={running} />
            <AppText size={14} muted>
              {running ? 'Ao vivo · simulado' : 'Pausado'}
            </AppText>
          </View>
        </View>
      </View>

      <StageCard glow={{ cx: 0.5, cy: 1, rx: 0.8, ry: 0.6, stop: 0.7 }} vertical padding={16} style={{ paddingVertical: 18, alignItems: 'center', gap: 10 }}>
        <Holo level={current.nivelCm} H={240} W={130} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <AppText font="display" size={36} lh={1.05} color="#FFFFFF">
            {fmtN(current.nivelCm)}
            <AppText font="display" size={16} color={stage.muted}>
              {' cm'}
            </AppText>
          </AppText>
          <RiskChip level={level} />
        </View>
      </StageCard>

      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ width: 12, height: 12, borderRadius: 4, backgroundColor: chart.level }} />
          <AppText weight={700}>Nível da água · ao vivo</AppText>
        </View>
        <AreaChart
          data={recent.map((r) => r.nivelCm)}
          max={100}
          color={chart.level}
          light={chart.levelLight}
          height={130}
          thresholds={[
            [LIMITS.atencao, chart.thresholds.atencao],
            [LIMITS.alerta, chart.thresholds.alerta],
            [LIMITS.critico, chart.thresholds.critico],
          ]}
        />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <AppText size={14} muted>{`${span} s atrás`}</AppText>
          <AppText size={14} muted>
            agora
          </AppText>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
          <View style={{ width: 12, height: 12, borderRadius: 4, backgroundColor: chart.rain }} />
          <AppText weight={700}>{`Chuva · ${fmtN(current.chuvaMm)} mm/h`}</AppText>
        </View>
        <AreaChart data={recent.map((r) => r.chuvaMm)} max={50} color={chart.rain} light={chart.rainLight} height={56} />
      </Card>

      <Card style={{ gap: 0, paddingVertical: 6 }}>
        <AppText weight={700} style={{ paddingVertical: 8 }} accessibilityRole="header">
          {`Últimas leituras · uma a cada ${READING_INTERVAL_MS / 1000} s`}
        </AppText>
        {readings.slice(0, 5).map((r, i) => {
          const lv = levelFor(r.nivelCm);
          const l = levelStyle[lv];
          return (
            <View
              key={r.id}
              accessible
              accessibilityLabel={`${formatTime(r.timestamp)}: ${r.nivelCm} centímetros, ${l.label}`}
              style={{ minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 12, borderTopWidth: i ? 1 : 0, borderTopColor: palette.line }}
            >
              <AppText font="mono" size={14} muted style={{ width: 52 }}>
                {formatTime(r.timestamp)}
              </AppText>
              <AppText weight={700} style={{ flex: 1 }}>{`${fmtN(r.nivelCm)} cm`}</AppText>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 3, paddingLeft: 6, paddingRight: 10, borderRadius: 20, backgroundColor: l.bg }}>
                <Icon name={l.icon} filled size={18 * fontScale} color={l.fg} />
                <AppText size={14} weight={700} color={l.fg} lh={1.2}>
                  {l.label}
                </AppText>
              </View>
            </View>
          );
        })}
      </Card>

      <Pressable
        onPress={() => setRaw((v) => !v)}
        accessibilityRole="button"
        accessibilityState={{ expanded: raw }}
        style={{ minHeight: 52, paddingHorizontal: 16, borderRadius: 18, borderWidth: 1, borderColor: palette.line, backgroundColor: palette.surface, flexDirection: 'row', alignItems: 'center', gap: 10 }}
      >
        <Icon name="data_object" size={22 * fontScale} color={palette.accent} />
        <AppText weight={700} style={{ flex: 1 }}>
          Dados brutos do sensor
        </AppText>
        <Icon name={raw ? 'keyboard_arrow_up' : 'keyboard_arrow_down'} size={24 * fontScale} color={palette.ink} />
      </Pressable>
      {raw ? <JsonBlock value={json} /> : null}
    </Screen>
  );
}

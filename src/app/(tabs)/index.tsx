import React, { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useMonitoring } from '@/contexts/MonitoringContext';
import { useTheme } from '@/contexts/SettingsContext';
import { pilotPoint } from '@/data/pilotPoint';
import { buildForecast, forecastIcon } from '@/data/forecast';
import { LEVEL_ORDER } from '@/services/iot/thresholds';
import { formatTime } from '@/utils/format';
import { chart, gradients, levelStyle, stage } from '@/styles/theme';
import { AppText } from '@/components/AppText';
import { IconBadge, RiskChip, Segmented, ShortcutTile, StageChip } from '@/components/Controls';
import { CityHolo } from '@/components/Hologram';
import { Icon } from '@/components/Icon';
import { Screen } from '@/components/Screen';
import { Card, StageCard } from '@/components/Surfaces';
import type { Reading } from '@/types';

const fmtN = (n: number) => String(n).replace('.', ',');
const pad = (n: number) => String(n).padStart(2, '0');

/** Profundidade em linguagem do dia a dia (referência: pessoa de 1,70 m). */
function depthOf(n: number): string {
  if (n < 15) return 'Abaixo da calçada';
  if (n < 45) return 'Abaixo do joelho';
  if (n < 60) return 'Na altura do joelho';
  if (n < 95) return 'Acima do joelho';
  return 'Na altura da cintura';
}

/** Tendência comparando com a leitura de uns 20 s atrás. */
function trendOf(readings: Reading[]) {
  const last = readings[0];
  const prev = readings[Math.min(4, readings.length - 1)];
  const d = last.nivelCm - prev.nivelCm;
  if (d > 1.5) return { icon: 'trending_up' as const, label: 'Subindo' };
  if (d < -1.5) return { icon: 'trending_down' as const, label: 'Descendo' };
  return { icon: 'trending_flat' as const, label: 'Estável' };
}

type FcTab = 'horas' | 'dias';

export default function InicioScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { palette, fontScale } = useTheme();
  const { current, level, readings } = useMonitoring();
  const [fcTab, setFcTab] = useState<FcTab>('horas');
  const forecast = useMemo(() => buildForecast(), []);
  const risk = levelStyle[level];
  const trend = trendOf(readings);
  const firstName = (user?.name ?? '').split(' ')[0] || 'Olá';

  const summary = (() => {
    if (fcTab === 'dias') {
      const d = forecast.days.find((x) => x.prob >= 60);
      return d ? { icon: 'rainy' as const, text: `Chuva provável: ${d.dia.toLowerCase()}` } : { icon: 'wb_sunny' as const, text: 'Sem chuva forte nos próximos dias' };
    }
    const f = forecast.hours.find((x) => x.prob >= 60);
    return f ? { icon: 'rainy' as const, text: `Chuva provável a partir das ${pad(f.hora)}h` } : { icon: 'wb_sunny' as const, text: 'Sem chuva nas próximas horas' };
  })();

  return (
    <Screen notice>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4, gap: 8 }}>
        <AppText font="display" size={22} color={palette.navy} lh={1.25} style={{ flexShrink: 1 }}>
          {`Olá, ${firstName}`}
        </AppText>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Icon name="location_on" size={20 * fontScale} color={palette.accent} />
          <AppText size={14} weight={700} muted>
            {pilotPoint.name}
          </AppText>
        </View>
      </View>

      <StageCard glow={{ cx: 0.85, cy: 0, rx: 1.2, ry: 0.8, stop: 0.55 }} padding={16} style={{ paddingBottom: 14, gap: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 10 }}>
          <View accessible accessibilityLabel={`Nível da água na rua: ${fmtN(current.nivelCm)} centímetros`}>
            <AppText size={14} color={stage.muted}>
              Nível da água na rua
            </AppText>
            <AppText font="display" size={40} lh={1.05} color="#FFFFFF" style={{ letterSpacing: -0.8 }}>
              {fmtN(current.nivelCm)}
              <AppText font="display" weight={500} size={18} color={stage.muted}>
                {' cm'}
              </AppText>
            </AppText>
          </View>
          <RiskChip level={level} />
        </View>

        <CityHolo level={current.nivelCm} rain={current.chuvaMm} />

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          <StageChip icon="accessibility_new" label={depthOf(current.nivelCm)} iconColor={stage.cyan} />
          <StageChip icon={trend.icon} label={trend.label} iconColor={stage.cyan} />
          <StageChip icon="rainy" label={`${fmtN(current.chuvaMm)} mm/h`} iconColor={stage.rain} />
        </View>
        <View style={{ paddingVertical: 10, paddingHorizontal: 12, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(124,243,255,0.25)' }}>
          <AppText size={15} color="#FFFFFF">
            {risk.desc}
          </AppText>
        </View>
        <AppText size={14} color={stage.muted}>{`${formatTime(current.timestamp)} · leitura simulada · ${current.sensorId}`}</AppText>
      </StageCard>

      <View accessibilityRole="list" accessibilityLabel="Faixas de risco" style={{ flexDirection: 'row', gap: 6 }}>
        {LEVEL_ORDER.map((k) => {
          const l = levelStyle[k];
          const on = k === level;
          return (
            <View
              key={k}
              accessible
              accessibilityLabel={`${l.label}, ${l.range}${on ? ', estado atual' : ''}`}
              style={{
                flex: 1,
                minHeight: 64,
                paddingVertical: 8,
                paddingHorizontal: 4,
                borderRadius: 16,
                borderWidth: 2,
                borderColor: on ? l.fg : palette.line,
                backgroundColor: on ? l.bg : palette.surface,
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
              }}
            >
              <Icon name={l.icon} filled size={24 * fontScale} color={on ? l.fg : palette.inkMuted} />
              <AppText size={14} weight={700} color={on ? l.fg : palette.inkMuted} numberOfLines={1}>
                {l.label}
              </AppText>
            </View>
          );
        })}
      </View>

      <Card radius={24} style={{ gap: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <IconBadge icon="umbrella" colors={gradients.history} size={40} iconSize={22} radius={13} />
          <AppText font="display" size={18} color={palette.navy} accessibilityRole="header" style={{ flex: 1 }}>
            Previsão de chuva
          </AppText>
        </View>
        <Segmented<FcTab>
          label="Período da previsão"
          framed={false}
          value={fcTab}
          onChange={setFcTab}
          options={[
            { value: 'horas', label: 'Próximas horas' },
            { value: 'dias', label: 'Próximos dias' },
          ]}
        />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 14, backgroundColor: palette.accentBg }}>
          <Icon name={summary.icon} size={24 * fontScale} color={palette.accent} />
          <AppText weight={700} color={palette.navy} style={{ flex: 1 }}>
            {summary.text}
          </AppText>
        </View>

        {fcTab === 'horas' ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -16 }} contentContainerStyle={{ gap: 8, paddingHorizontal: 16, paddingTop: 2, paddingBottom: 6 }}>
            {forecast.hours.map((f, i) => {
              const strong = f.prob >= 60;
              return (
                <View
                  key={i}
                  accessible
                  accessibilityLabel={`${pad(f.hora)}h: ${f.prob}% de chance de chuva, ${fmtN(f.mm)} mm`}
                  style={{ width: 68 * Math.min(fontScale, 1.15), paddingVertical: 10, paddingHorizontal: 6, borderRadius: 18, borderWidth: 1, borderColor: strong ? chart.rain : palette.line, backgroundColor: strong ? palette.accentBg : palette.surface, alignItems: 'center', gap: 6 }}
                >
                  <AppText size={14} weight={700} muted numberOfLines={1}>
                    {i === 0 ? 'Em 1 h' : `${pad(f.hora)}h`}
                  </AppText>
                  <Icon name={forecastIcon(f.prob, f.mm)} filled size={28} color={chart.forecast} />
                  <View style={{ width: 10, height: 44, borderRadius: 5, backgroundColor: palette.accentBg, justifyContent: 'flex-end', overflow: 'hidden' }}>
                    <View style={{ height: `${f.prob}%`, backgroundColor: chart.rain, borderRadius: 5 }} />
                  </View>
                  <AppText size={15} weight={700}>{`${f.prob}%`}</AppText>
                  <AppText size={14} muted numberOfLines={1}>{`${fmtN(f.mm)} mm`}</AppText>
                </View>
              );
            })}
          </ScrollView>
        ) : (
          <View accessibilityRole="list">
            {forecast.days.map((f) => (
              <View
                key={f.dia}
                accessible
                accessibilityLabel={`${f.dia}: ${f.prob}% de chance de chuva, ${fmtN(f.mm)} mm, máxima ${f.max} e mínima ${f.min} graus`}
                style={{ minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1, borderBottomColor: palette.line, paddingVertical: 6 }}
              >
                <AppText size={15} weight={700} style={{ width: 64 }}>
                  {f.dia}
                </AppText>
                <Icon name={forecastIcon(f.prob, f.mm / 3)} filled size={26} color={chart.forecast} />
                <View style={{ flex: 1, gap: 3 }}>
                  <View style={{ height: 8, borderRadius: 4, backgroundColor: palette.accentBg, overflow: 'hidden' }}>
                    <View style={{ width: `${f.prob}%`, height: '100%', backgroundColor: chart.rain, borderRadius: 4 }} />
                  </View>
                  <AppText size={14} muted>{`${f.prob}% · ${fmtN(f.mm)} mm`}</AppText>
                </View>
                <AppText size={14} weight={700}>
                  {`${f.max}° `}
                  <AppText size={14} muted>{`${f.min}°`}</AppText>
                </AppText>
              </View>
            ))}
          </View>
        )}
        <AppText size={14} muted>
          Previsão de demonstração · fonte: API de tempo
        </AppText>
      </Card>

      <View style={{ gap: 10 }}>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <ShortcutTile label="Sensor ao vivo" icon="sensors" colors={gradients.sensor} onPress={() => router.push('/sensor')} />
          <ShortcutTile label="Histórico" icon="insights" colors={gradients.history} onPress={() => router.push('/historico')} />
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <ShortcutTile label="Relatar" icon="add_a_photo" colors={gradients.report} onPress={() => router.push('/relatar')} />
          <ShortcutTile label="Canais oficiais" icon="call" colors={gradients.official} onPress={() => router.push('/fontes')} />
        </View>
      </View>
    </Screen>
  );
}

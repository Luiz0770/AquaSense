import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useMonitoring, type SensorView } from '@/contexts/MonitoringContext';
import { useTheme } from '@/contexts/SettingsContext';
import { READING_INTERVAL_MS } from '@/services/iot/simulator';
import { levelFor, LIMITS } from '@/services/iot/thresholds';
import { formatTime } from '@/utils/format';
import { cardShadow, chart, gradients, levelStyle, stage } from '@/styles/theme';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { AreaChart } from '@/components/Charts';
import { DashedNote, IconBadge, JsonBlock, RiskChip, SectionTitle } from '@/components/Controls';
import { Holo, LiveDot } from '@/components/Hologram';
import { Icon } from '@/components/Icon';
import { Screen } from '@/components/Screen';
import { sensorState } from '@/components/SensorPicker';
import { Card, StageCard } from '@/components/Surfaces';

const fmtN = (n: number) => String(n).replace('.', ',');
const POINTS = 24;
const MAX_BAR = 100;

/** Um cartão do carrossel: holograma, nível e estado de um sensor. */
function SensorSlide({ s, index, total, width, onPrev, onNext }: { s: SensorView; index: number; total: number; width: number; onPrev: () => void; onNext: () => void }) {
  const { fontScale } = useTheme();
  return (
    <View style={{ width, paddingVertical: 6 }}>
      <StageCard glow={{ cx: 0.5, cy: 1, rx: 0.8, ry: 0.6, stop: 0.7 }} vertical padding={16} style={{ paddingVertical: 14, gap: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Pressable onPress={onPrev} accessibilityRole="button" accessibilityLabel="Sensor anterior" style={navBtn}>
            <Icon name="chevron_left" size={26 * fontScale} color="#FFFFFF" />
          </Pressable>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <AppText font="display" weight={700} size={18} color="#FFFFFF" accessibilityRole="header">
              {s.nome}
            </AppText>
            <AppText size={13} color={stage.muted}>{`${index + 1} de ${total} · ${s.def.pinos}`}</AppText>
          </View>
          <Pressable onPress={onNext} accessibilityRole="button" accessibilityLabel="Próximo sensor" style={navBtn}>
            <Icon name="chevron_right" size={26 * fontScale} color="#FFFFFF" />
          </Pressable>
        </View>
        <View style={{ alignItems: 'center' }}>
          <Holo level={s.current.nivelCm} H={220} W={120} />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <AppText font="display" size={36} lh={1.05} color="#FFFFFF">
            {fmtN(s.current.nivelCm)}
            <AppText font="display" size={16} color={stage.muted}>
              {' cm'}
            </AppText>
          </AppText>
          <RiskChip level={s.level} />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <LiveDot on={s.running || s.source === 'esp32'} />
          <AppText size={14} color={stage.muted2}>
            {`${s.source === 'esp32' ? 'Ao vivo · ESP32 (Wokwi)' : s.running ? 'Ao vivo · simulado' : 'Pausado'} · ${s.trend.label}`}
          </AppText>
        </View>
      </StageCard>
    </View>
  );
}

/**
 * Sensores: carrossel com um cartão (holograma) por sensor — passe para o lado ou use ‹ › —
 * e, abaixo, os gráficos e as últimas leituras do sensor do cartão. O agente vê ainda o ranking.
 */
export function SensorScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const agente = user?.role === 'agente';
  const { palette, fontScale } = useTheme();
  const { sensors, sensorById, selectedSensorId, selectSensor, liveCount } = useMonitoring();
  const [raw, setRaw] = useState(false);
  const [width, setWidth] = useState(0);
  const listRef = useRef<FlatList<SensorView>>(null);

  const s = sensorById(selectedSensorId);
  const idx = Math.max(0, sensors.findIndex((x) => x.id === s.id));
  const go = useCallback((d: number) => selectSensor(sensors[(idx + d + sensors.length) % sensors.length].id), [idx, sensors, selectSensor]);

  // Botões ‹ ›, ranking ou outra tela trocaram o sensor: o carrossel vai até ele.
  const shown = useRef(idx);
  useEffect(() => {
    if (!width || shown.current === idx) return;
    shown.current = idx;
    listRef.current?.scrollToOffset({ offset: idx * width, animated: true });
  }, [idx, width]);

  const onSwipe = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!width) return;
    const i = Math.round(e.nativeEvent.contentOffset.x / width);
    const target = sensors[Math.min(sensors.length - 1, Math.max(0, i))];
    shown.current = i;
    if (target && target.id !== s.id) selectSensor(target.id);
  };

  // As leituras vêm da mais nova para a mais antiga; o gráfico vai da mais antiga para agora.
  const recent = s.readings.slice(0, POINTS).reverse();
  const span = Math.round(((recent.length - 1) * READING_INTERVAL_MS) / 1000);
  const { id: _id, ...json } = s.current;
  const ranking = useMemo(() => [...sensors].sort((a, b) => b.current.nivelCm - a.current.nivelCm), [sensors]);

  return (
    <Screen notice>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 4 }}>
        <IconBadge icon="memory" colors={gradients.sensor} size={48} iconSize={28} radius={16} />
        <View style={{ flex: 1 }}>
          <AppText font="display" size={20} color={palette.navy} lh={1.25} accessibilityRole="header">
            Sensores
          </AppText>
          <AppText size={14} muted>
            {`${sensors.length} sensores ultrassônicos · ${liveCount ? `${liveCount} ao vivo pelo ESP32` : 'simulados'}`}
          </AppText>
        </View>
      </View>

      <View onLayout={(e) => setWidth(Math.round(e.nativeEvent.layout.width))} style={{ gap: 6 }}>
        {width ? (
          <FlatList
            ref={listRef}
            data={sensors}
            keyExtractor={(x) => x.id}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            initialScrollIndex={idx}
            getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
            onMomentumScrollEnd={onSwipe}
            renderItem={({ item, index }) => (
              <SensorSlide s={item} index={index} total={sensors.length} width={width} onPrev={() => go(-1)} onNext={() => go(1)} />
            )}
          />
        ) : null}
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6 }} importantForAccessibility="no-hide-descendants">
          {sensors.map((x, i) => (
            <View key={x.id} style={{ width: i === idx ? 20 : 8, height: 8, borderRadius: 4, backgroundColor: i === idx ? palette.navy : palette.border }} />
          ))}
        </View>
      </View>

      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ width: 12, height: 12, borderRadius: 4, backgroundColor: chart.level }} />
          <AppText weight={700}>{`Nível da água · ${s.nome}`}</AppText>
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
          <AppText weight={700}>{`Chuva na região · ${fmtN(s.current.chuvaMm)} mm/h`}</AppText>
        </View>
        <AreaChart data={recent.map((r) => r.chuvaMm)} max={50} color={chart.rain} light={chart.rainLight} height={56} />
      </Card>

      <Card style={{ gap: 0, paddingVertical: 6 }}>
        <AppText weight={700} style={{ paddingVertical: 8 }} accessibilityRole="header">
          {`Últimas leituras · ${s.nome}`}
        </AppText>
        {s.readings.slice(0, 5).map((r, i) => {
          const l = levelStyle[levelFor(r.nivelCm)];
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

      {agente ? (
        <>
          <SectionTitle>Todos os sensores</SectionTitle>
          <Card style={{ gap: 4, paddingVertical: 8 }}>
            {ranking.map((x, i) => {
              const l = levelStyle[x.level];
              const on = x.id === s.id;
              return (
                <Pressable
                  key={x.id}
                  onPress={() => selectSensor(x.id)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                  accessibilityLabel={`${i + 1}º ${x.nome}: ${fmtN(x.current.nivelCm)} centímetros, ${l.label}, ${sensorState(x)}`}
                  style={{ minHeight: 52, paddingVertical: 6, paddingHorizontal: 8, borderRadius: 14, backgroundColor: on ? palette.accentBg : 'transparent', gap: 4 }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <AppText size={13} weight={700} muted style={{ width: 22 }}>{`${i + 1}º`}</AppText>
                    <AppText weight={700} style={{ flex: 1 }}>
                      {x.nome}
                    </AppText>
                    <AppText size={13} muted>
                      {sensorState(x)}
                    </AppText>
                    <AppText weight={700} style={{ minWidth: 58, textAlign: 'right' }}>{`${fmtN(x.current.nivelCm)} cm`}</AppText>
                  </View>
                  <View style={{ marginLeft: 30, height: 8, borderRadius: 4, backgroundColor: palette.accentBg }}>
                    <View style={{ width: `${Math.min(100, (x.current.nivelCm / MAX_BAR) * 100)}%`, height: 8, borderRadius: 4, backgroundColor: l.grad[1] }} />
                    {[LIMITS.atencao, LIMITS.alerta, LIMITS.critico].map((t) => (
                      <View key={t} style={{ position: 'absolute', left: `${t}%`, top: -2, width: 2, height: 12, borderRadius: 1, backgroundColor: palette.inkMuted, opacity: 0.5 }} />
                    ))}
                  </View>
                </Pressable>
              );
            })}
            <AppText size={12} muted style={{ marginLeft: 38 }}>
              Marcas em 20, 40 e 70 cm (Atenção, Alerta, Crítico)
            </AppText>
          </Card>
          <Button label="Gerenciar na Simulação" icon="tune" variant="outline" height={52} onPress={() => router.push('/simulacao')} />
        </>
      ) : (
        <DashedNote icon="info">Passe o cartão para o lado para ver cada sensor. A Início mostra o sensor da sua localização.</DashedNote>
      )}

      <Pressable
        onPress={() => setRaw((v) => !v)}
        accessibilityRole="button"
        accessibilityState={{ expanded: raw }}
        style={[
          { minHeight: 52, paddingHorizontal: 16, borderRadius: 18, borderWidth: 1, borderColor: palette.line, backgroundColor: palette.surface, flexDirection: 'row', alignItems: 'center', gap: 10 },
          cardShadow(palette, 0.04),
        ]}
      >
        <Icon name="data_object" size={22 * fontScale} color={palette.accent} />
        <AppText weight={700} style={{ flex: 1 }}>
          {`Dados brutos · ${s.nome}`}
        </AppText>
        <Icon name={raw ? 'keyboard_arrow_up' : 'keyboard_arrow_down'} size={24 * fontScale} color={palette.ink} />
      </Pressable>
      {raw ? <JsonBlock value={json} /> : null}
    </Screen>
  );
}

const navBtn = {
  width: 44,
  height: 44,
  borderRadius: 14,
  backgroundColor: 'rgba(255,255,255,0.12)',
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.25)',
  alignItems: 'center',
  justifyContent: 'center',
} as const;

import React, { useRef, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useMonitoring } from '@/contexts/MonitoringContext';
import { useTheme } from '@/contexts/SettingsContext';
import { SCENARIO_ICON, SCENARIO_SHORT } from '@/data/scenarios';
import { SCENARIO_HINT, SCENARIO_LABEL, SCENARIOS } from '@/services/iot/simulator';
import { cardShadow, levelStyle, stage } from '@/styles/theme';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { RiskChip, ScreenTitle, SectionTitle, Segmented } from '@/components/Controls';
import { Holo, LiveDot } from '@/components/Hologram';
import { Icon } from '@/components/Icon';
import { Screen } from '@/components/Screen';
import { sensorState } from '@/components/SensorPicker';
import { StageCard } from '@/components/Surfaces';

const fmtN = (n: number) => String(n).replace('.', ',');
type ListFilter = 'todos' | 'ativos' | 'pausados';

/**
 * Simulação por sensor: cartão escuro do sensor escolhido (fonte, pausar, leitura, reiniciar), cenário dele
 * e a lista de todos os sensores com ações em lote. Sensores que o ESP32 está mandando ficam "Ao vivo"
 * e a simulação deles espera até o Wokwi parar por 15 s.
 */
export default function SimulacaoScreen() {
  const { fontScale, palette } = useTheme();
  const {
    sensors,
    sensorById,
    selectedSensorId,
    selectSensor,
    setScenarioFor,
    toggleRun,
    stepNow,
    restartSensor,
    setAllRunning,
    restartAll,
    applyScenarioToAll,
    apiRainMm,
  } = useMonitoring();
  const [filter, setFilter] = useState<ListFilter>('todos');
  const scrollRef = useRef<ScrollView>(null);

  const s = sensorById(selectedSensorId);
  const idx = sensors.findIndex((x) => x.id === s.id);
  const go = (d: number) => selectSensor(sensors[(idx + d + sensors.length) % sensors.length].id);
  const esp = s.source === 'esp32';
  const running = sensors.filter((x) => x.running).length;

  const list = sensors.filter((x) => (filter === 'todos' ? true : filter === 'ativos' ? x.running || x.source === 'esp32' : !x.running && x.source !== 'esp32'));

  return (
    <Screen notice scrollRef={scrollRef}>
      <ScreenTitle>Simulação</ScreenTitle>

      <StageCard glow={{ cx: 0.85, cy: 0, rx: 1, ry: 0.8, stop: 0.6 }} padding={16} style={{ paddingVertical: 14, gap: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Pressable onPress={() => go(-1)} accessibilityRole="button" accessibilityLabel="Sensor anterior" style={navBtn}>
            <Icon name="chevron_left" size={26 * fontScale} color="#FFFFFF" />
          </Pressable>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <AppText font="display" weight={700} size={18} color="#FFFFFF" accessibilityRole="header">
              {s.nome}
            </AppText>
            <AppText size={13} color={stage.muted}>{esp ? 'Fonte: ESP32 (Wokwi)' : 'Fonte: simulador do app'}</AppText>
          </View>
          <Pressable onPress={() => go(1)} accessibilityRole="button" accessibilityLabel="Próximo sensor" style={navBtn}>
            <Icon name="chevron_right" size={26 * fontScale} color="#FFFFFF" />
          </Pressable>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Holo level={s.current.nivelCm} H={150} W={84} />
          <View style={{ flex: 1, gap: 10 }}>
            <RiskChip level={s.level} />
            <AppText font="display" size={36} lh={1.05} color="#FFFFFF">
              {fmtN(s.current.nivelCm)}
              <AppText font="display" size={16} color={stage.muted}>
                {' cm'}
              </AppText>
            </AppText>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <LiveDot on={s.running || esp} />
              <AppText size={14} color={stage.muted2} style={{ flexShrink: 1 }}>
                {esp ? 'Ao vivo · ESP32 (Wokwi)' : s.running ? SCENARIO_LABEL[s.scenario] : `Pausado · ${SCENARIO_LABEL[s.scenario]}`}
              </AppText>
            </View>
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Button
            label={s.running ? 'Pausar' : 'Retomar'}
            icon={s.running ? 'pause' : 'play_arrow'}
            variant="white"
            compact
            height={48}
            style={{ flex: 1.2 }}
            onPress={() => toggleRun(s.id)}
          />
          <Button label="Leitura" icon="skip_next" variant="soft" compact height={48} style={{ flex: 1 }} onPress={() => stepNow(s.id)} disabled={esp} />
          <Button label="Reiniciar" icon="restart_alt" variant="soft" compact height={48} style={{ flex: 1 }} onPress={() => restartSensor(s.id)} />
        </View>
        {esp ? (
          <AppText size={13} color={stage.muted2}>
            Este sensor está recebendo leituras do Wokwi. Mude o nível dele no Node-RED; a simulação volta se o ESP32 parar.
          </AppText>
        ) : null}
      </StageCard>

      <SectionTitle>{`Cenário do ${s.nome}`}</SectionTitle>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 2, paddingVertical: 2 }} accessibilityRole="radiogroup" accessibilityLabel={`Cenário do ${s.nome}`}>
        {SCENARIOS.map((sc) => {
          const on = s.scenario === sc;
          return (
            <Pressable
              key={sc}
              onPress={() => setScenarioFor(s.id, sc)}
              accessibilityRole="radio"
              accessibilityState={{ selected: on }}
              accessibilityLabel={`${SCENARIO_LABEL[sc]}: ${SCENARIO_SHORT[sc]}`}
              style={[
                {
                  width: 150,
                  minHeight: 92,
                  padding: 12,
                  borderRadius: 18,
                  borderWidth: on ? 2 : 1,
                  borderColor: on ? palette.selectedBorder : palette.line,
                  backgroundColor: on ? palette.accentBg : palette.surface,
                  justifyContent: 'space-between',
                  gap: 6,
                },
                cardShadow(palette, 0.05),
              ]}
            >
              <Icon name={SCENARIO_ICON[sc]} size={28 * fontScale} color={on ? palette.navy : palette.accent} />
              <View>
                <AppText font="display" weight={600} color={on ? palette.navy : palette.ink}>
                  {SCENARIO_LABEL[sc]}
                </AppText>
                <AppText size={13} muted lh={1.25}>
                  {SCENARIO_SHORT[sc]}
                </AppText>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
      <AppText size={14} muted style={{ paddingHorizontal: 4 }}>
        {s.scenario === 'real'
          ? `${SCENARIO_HINT.real} Agora: ${apiRainMm === null ? 'aguardando a Open-Meteo' : `${fmtN(apiRainMm)} mm/h`}.`
          : SCENARIO_HINT[s.scenario]}
      </AppText>
      <Button label="Usar este cenário em todos os sensores" icon="select_all" variant="outline" height={48} onPress={() => applyScenarioToAll(s.scenario)} />

      <SectionTitle>Todos os sensores</SectionTitle>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Button
          label={running ? 'Pausar todos' : 'Retomar todos'}
          icon={running ? 'pause' : 'play_arrow'}
          variant="soft"
          compact
          height={48}
          style={{ flex: 1 }}
          onPress={() => setAllRunning(running === 0)}
        />
        <Button label="Reiniciar todos" icon="restart_alt" variant="soft" compact height={48} style={{ flex: 1 }} onPress={restartAll} />
      </View>
      <Segmented<ListFilter>
        value={filter}
        onChange={setFilter}
        label="Filtrar sensores"
        options={[
          { value: 'todos', label: `Todos (${sensors.length})` },
          { value: 'ativos', label: 'Ao vivo' },
          { value: 'pausados', label: 'Pausados' },
        ]}
      />
      <View style={{ gap: 8 }}>
        {list.length === 0 ? (
          <AppText size={14} muted style={{ paddingHorizontal: 4 }}>
            Nenhum sensor neste filtro.
          </AppText>
        ) : (
          list.map((x) => {
            const l = levelStyle[x.level];
            const on = x.id === s.id;
            const live = x.source === 'esp32';
            return (
              <View
                key={x.id}
                style={[
                  { minHeight: 64, borderRadius: 18, borderWidth: on ? 2 : 1, borderColor: on ? palette.selectedBorder : palette.line, backgroundColor: on ? palette.accentBg : palette.surface, flexDirection: 'row', alignItems: 'center', overflow: 'hidden' },
                  cardShadow(palette, 0.05),
                ]}
              >
                <View style={{ width: 5, alignSelf: 'stretch', backgroundColor: l.grad[1] }} />
                <Pressable
                  onPress={() => {
                    selectSensor(x.id);
                    scrollRef.current?.scrollTo({ y: 0, animated: true });
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`${x.nome}: ${fmtN(x.current.nivelCm)} centímetros, ${l.label}, ${sensorState(x)}. Abrir no topo.`}
                  style={{ flex: 1, paddingVertical: 10, paddingHorizontal: 12, gap: 2 }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <AppText weight={700}>{x.nome}</AppText>
                    <AppText size={13} weight={700} color={palette.shadows ? l.fg : palette.ink}>{`· ${l.label}`}</AppText>
                  </View>
                  <AppText size={13} muted>{`${fmtN(x.current.nivelCm)} cm · ${live ? 'Ao vivo (ESP32)' : `${SCENARIO_LABEL[x.scenario]}${x.running ? '' : ' · pausado'}`}`}</AppText>
                </Pressable>
                <Pressable
                  onPress={() => toggleRun(x.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`${x.running ? 'Pausar' : 'Retomar'} ${x.nome}`}
                  style={{ width: 48, height: 48, marginRight: 8, borderRadius: 14, backgroundColor: palette.accentBg, alignItems: 'center', justifyContent: 'center' }}
                >
                  <Icon name={x.running ? 'pause' : 'play_arrow'} size={24 * fontScale} color={palette.navy} />
                </Pressable>
              </View>
            );
          })
        )}
      </View>
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

import React from 'react';
import { View } from 'react-native';
import { useMonitoring } from '@/contexts/MonitoringContext';
import { useTheme } from '@/contexts/SettingsContext';
import { SCENARIO_ICON, SCENARIO_SHORT } from '@/data/scenarios';
import { SCENARIO_HINT, SCENARIO_LABEL, SCENARIOS } from '@/services/iot/simulator';
import { stage } from '@/styles/theme';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { JsonBlock, RiskChip, ScreenTitle, SelectCard } from '@/components/Controls';
import { Holo, LiveDot } from '@/components/Hologram';
import { Icon } from '@/components/Icon';
import { Screen } from '@/components/Screen';
import { Card, StageCard } from '@/components/Surfaces';
import { LIVE_SOURCE } from '@/services/iot/liveSource';

const fmtN = (n: number) => String(n).replace('.', ',');

export default function SimulacaoScreen() {
  const { fontScale, palette } = useTheme();
  const { current, level, scenario, running, setScenario, togglePause, stepNow, restart, source, liveStatus } = useMonitoring();
  const esp = source === 'esp32';
  const sourceHint = esp
    ? 'Recebendo leituras do ESP32 por MQTT. O simulador fica em espera e volta sozinho se o sensor parar de enviar por 15 s.'
    : liveStatus === 'conectado'
      ? `Conectado ao broker, aguardando o ESP32 no tópico ${LIVE_SOURCE.topic}. Enquanto isso, o app simula.`
      : 'Sem conexão com o broker MQTT. Usando o simulador do app.';
  const { id: _id, ...json } = current;

  return (
    <Screen notice>
      <ScreenTitle>Simulação</ScreenTitle>

      <StageCard glow={{ cx: 0.85, cy: 0, rx: 1, ry: 0.8, stop: 0.6 }} padding={16} style={{ paddingVertical: 14, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Holo level={current.nivelCm} H={150} W={84} />
        <View style={{ flex: 1, gap: 10 }}>
          <RiskChip level={level} />
          <AppText font="display" size={36} lh={1.05} color="#FFFFFF">
            {fmtN(current.nivelCm)}
            <AppText font="display" size={16} color={stage.muted}>
              {' cm'}
            </AppText>
          </AppText>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <LiveDot on={running} />
            <AppText size={14} color={stage.muted2} style={{ flexShrink: 1 }}>
              {running ? SCENARIO_LABEL[scenario] : `Pausado · ${SCENARIO_LABEL[scenario]}`}
            </AppText>
          </View>
        </View>
      </StageCard>

      <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Icon name={esp ? 'sensors' : liveStatus === 'conectado' ? 'wifi' : 'tune'} size={28 * fontScale} color={palette.accent} />
        <View style={{ flex: 1, gap: 2 }}>
          <AppText weight={700}>{esp ? 'Fonte: ESP32 no Wokwi' : 'Fonte: simulador do app'}</AppText>
          <AppText size={14} muted>
            {sourceHint}
          </AppText>
        </View>
      </Card>

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Button
          label={running ? 'Pausar' : 'Retomar'}
          icon={running ? 'pause' : 'play_arrow'}
          display={false}
          style={{ flex: 1 }}
          onPress={togglePause}
        />
        <Button label="Nova leitura" icon="skip_next" variant="outline" height={56} style={{ flex: 1 }} onPress={stepNow} disabled={esp} />
      </View>

      <View accessibilityRole="radiogroup" accessibilityLabel="Cenário" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {SCENARIOS.map((s) => (
          <SelectCard
            key={s}
            label={`${SCENARIO_LABEL[s]}: ${SCENARIO_SHORT[s]}`}
            selected={scenario === s}
            minHeight={100}
            style={{ flexBasis: '47%', flexGrow: 1 }}
            onPress={() => {
              setScenario(s);
              if (!running) togglePause();
            }}
          >
            {(fg) => (
              <>
                <Icon name={SCENARIO_ICON[s]} size={32 * fontScale} color={fg} />
                <View>
                  <AppText font="display" weight={600} color={fg}>
                    {SCENARIO_LABEL[s]}
                  </AppText>
                  <AppText size={14} color={fg}>
                    {SCENARIO_SHORT[s]}
                  </AppText>
                </View>
              </>
            )}
          </SelectCard>
        ))}
      </View>
      <AppText size={14} muted style={{ paddingHorizontal: 4 }}>
        {SCENARIO_HINT[scenario]}
      </AppText>

      <JsonBlock value={json} />

      <Button label="Reiniciar" icon="restart_alt" variant="ghost" height={48} onPress={restart} />
    </Screen>
  );
}

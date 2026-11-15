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
import { StageCard } from '@/components/Surfaces';

const fmtN = (n: number) => String(n).replace('.', ',');

export default function SimulacaoScreen() {
  const { fontScale } = useTheme();
  const { current, level, scenario, running, setScenario, togglePause, stepNow, restart } = useMonitoring();
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

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Button
          label={running ? 'Pausar' : 'Retomar'}
          icon={running ? 'pause' : 'play_arrow'}
          display={false}
          style={{ flex: 1 }}
          onPress={togglePause}
        />
        <Button label="Nova leitura" icon="skip_next" variant="outline" height={56} style={{ flex: 1 }} onPress={stepNow} />
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

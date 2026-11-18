import React from 'react';
import { View } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useMonitoring } from '@/contexts/MonitoringContext';
import { useTheme } from '@/contexts/SettingsContext';
import type { FontSize } from '@/types';
import { fontScaleBySize, gradients, levelStyle, stage } from '@/styles/theme';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { DashedNote, ScreenTitle, SelectCard, SwitchRow } from '@/components/Controls';
import { Icon } from '@/components/Icon';
import { Screen } from '@/components/Screen';
import { Gradient, StageCard } from '@/components/Surfaces';

const SIZES: { id: FontSize; label: string; preview: number }[] = [
  { id: 'normal', label: 'Padrão', preview: 20 },
  { id: 'grande', label: 'Grande', preview: 26 },
  { id: 'muito_grande', label: 'Maior', preview: 32 },
];

const fmtN = (n: number) => String(n).replace('.', ',');

export default function PerfilScreen() {
  const { user, signOut } = useAuth();
  const { current, level } = useMonitoring();
  const { settings, setFontSize, setHighContrast, setReduceMotion } = useTheme();
  const isAgent = user?.role === 'agente';

  return (
    <Screen back>
      <StageCard radius={24} padding={16} style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <Gradient colors={gradients.dropBig} style={{ width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="person" size={30} color="#FFFFFF" />
        </Gradient>
        <View style={{ flex: 1, minWidth: 0 }}>
          <AppText font="display" size={18} color="#FFFFFF" lh={1.3}>
            {user?.name ?? 'Visitante'}
          </AppText>
          <AppText size={14} color={stage.muted2}>
            {user?.email ?? ''}
          </AppText>
          <AppText size={14} color={stage.muted2}>
            {isAgent ? 'Agente (demonstração)' : 'Cidadão'}
          </AppText>
        </View>
      </StageCard>

      <ScreenTitle size={20}>Acessibilidade</ScreenTitle>
      <View accessibilityRole="radiogroup" accessibilityLabel="Tamanho do texto" style={{ flexDirection: 'row', gap: 10 }}>
        {SIZES.map((s) => (
          <SelectCard
            key={s.id}
            label={`Texto ${s.label}`}
            selected={settings.fontSize === s.id}
            minHeight={96}
            onPress={() => setFontSize(s.id)}
          >
            {(fg) => (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                <AppText font="display" weight={700} size={s.preview / fontScaleBySize[settings.fontSize]} lh={1} color={fg}>
                  Aa
                </AppText>
                <AppText size={14 / fontScaleBySize[settings.fontSize]} weight={700} color={fg}>
                  {s.label}
                </AppText>
              </View>
            )}
          </SelectCard>
        ))}
      </View>

      <SwitchRow icon="contrast" label="Alto contraste" value={settings.highContrast} onChange={setHighContrast} />
      <SwitchRow icon="animation" label="Reduzir movimento" value={settings.reduceMotion} onChange={setReduceMotion} />

      <DashedNote icon={levelStyle[level].icon} iconColor={levelStyle[level].fg}>
        {`Prévia: nível da água ${fmtN(current.nivelCm)} cm · ${levelStyle[level].label}`}
      </DashedNote>
      <AppText size={14} muted style={{ paddingHorizontal: 4 }}>
        Preferências salvas neste aparelho.
      </AppText>

      <Button label="Sair" icon="logout" variant="danger" onPress={() => void signOut()} />
    </Screen>
  );
}

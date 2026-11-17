import React from 'react';
import { Pressable, View } from 'react-native';
import { useMonitoring } from '@/contexts/MonitoringContext';
import { useTheme } from '@/contexts/SettingsContext';
import { levelStyle } from '@/styles/theme';
import type { Level } from '@/types';
import { AppText } from './AppText';
import { Button } from './Button';
import { LevelBadge } from './Controls';
import { Icon } from './Icon';
import { FadeIn } from './motion';

const fmtN = (n: number) => String(n).replace('.', ',');

/**
 * Aviso de mudança de estado (design v2): cartão branco com borda fina na cor `line`,
 * sombra suave, chip do nível em gradiente, título na cor `fg`, fechar e "Ver canais oficiais".
 */
export function AlertBanner({
  level,
  nivelCm,
  onClose,
  onSources,
}: {
  level: Level;
  nivelCm: number;
  onClose: () => void;
  onSources: () => void;
}) {
  const { palette } = useTheme();
  const { sourceLabel } = useMonitoring();
  const l = levelStyle[level];
  return (
    <FadeIn
      style={[
        {
          marginHorizontal: 12,
          marginTop: 6,
          marginBottom: 10,
          padding: 12,
          borderRadius: 24,
          backgroundColor: palette.surface,
          borderWidth: 1,
          borderColor: palette.shadows ? l.line : palette.line,
          gap: 10,
        },
        palette.shadows && { shadowColor: '#041D3A', shadowOpacity: 0.28, shadowRadius: 32, shadowOffset: { width: 0, height: 14 }, elevation: 8 },
      ]}
    >
      <View accessibilityRole="alert" accessibilityLiveRegion="assertive" style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <LevelBadge level={level} size={46} iconSize={26} radius={16} />
        <View style={{ flex: 1 }}>
          <AppText font="display" size={17} color={palette.shadows ? l.fg : palette.ink} lh={1.3}>
            {`${l.label} · ${fmtN(nivelCm)} cm`}
          </AppText>
          <AppText size={14} lh={1.3} muted>
            {`Estimativa não oficial · ${sourceLabel}`}
          </AppText>
        </View>
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Fechar aviso"
          hitSlop={4}
          style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }}
        >
          <Icon name="close" size={24} color={palette.inkMuted} />
        </Pressable>
      </View>
      <Button label="Ver canais oficiais" icon="call" onPress={onSources} height={50} display={false} />
    </FadeIn>
  );
}

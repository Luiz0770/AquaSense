import React from 'react';
import { Pressable, View } from 'react-native';
import { useTheme } from '@/contexts/SettingsContext';
import { levelStyle } from '@/styles/theme';
import type { Level } from '@/types';
import { AppText } from './AppText';
import { Icon } from './Icon';
import { FadeIn } from './motion';

const fmtN = (n: number) => String(n).replace('.', ',');

/** Aviso de mudança de estado do design: ícone, estado e nível, fechar e "Ver canais oficiais". */
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
  const { palette, fontScale } = useTheme();
  const l = levelStyle[level];
  return (
    <FadeIn
      style={[
        { marginHorizontal: 12, marginTop: 4, marginBottom: 8, padding: 12, borderRadius: 20, backgroundColor: l.bg, borderWidth: 2, borderColor: l.fg, gap: 10 },
        palette.shadows && { shadowColor: '#041D3A', shadowOpacity: 0.18, shadowRadius: 24, shadowOffset: { width: 0, height: 10 }, elevation: 6 },
      ]}
    >
      <View accessibilityRole="alert" accessibilityLiveRegion="assertive" style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: l.fg, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={l.icon} filled size={26} color="#FFFFFF" />
        </View>
        <View style={{ flex: 1 }}>
          <AppText font="display" size={17} color={l.fg} lh={1.25}>
            {`${l.label} · ${fmtN(nivelCm)} cm`}
          </AppText>
          <AppText size={14} lh={1.3}>
            Estimativa não oficial · simulado
          </AppText>
        </View>
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Fechar aviso"
          style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }}
        >
          <Icon name="close" size={24} color={l.fg} />
        </Pressable>
      </View>
      <Pressable
        onPress={onSources}
        accessibilityRole="button"
        style={({ pressed }) => ({
          minHeight: 48,
          borderRadius: 14,
          backgroundColor: l.fg,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          opacity: pressed ? 0.85 : 1,
        })}
      >
        <Icon name="call" size={20 * fontScale} color="#FFFFFF" />
        <AppText weight={700} color="#FFFFFF">
          Ver canais oficiais
        </AppText>
      </Pressable>
    </FadeIn>
  );
}

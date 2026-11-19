import React from 'react';
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';
import type { TabTriggerSlotProps } from 'expo-router/ui';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/SettingsContext';
import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';

/** Botão de uma aba. Use dentro de <TabTrigger asChild>. */
export function TabButton({
  label,
  icon,
  badge,
  isFocused,
  onPress,
  onLongPress,
}: Pick<TabTriggerSlotProps, 'isFocused' | 'onPress' | 'onLongPress'> & { label: string; icon: IconName; badge?: number }) {
  const { palette } = useTheme();
  const active = !!isFocused;
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityRole="tab"
      accessibilityLabel={badge ? `${label}, ${badge} pendentes` : label}
      accessibilityState={{ selected: active }}
      style={{ flex: 1, minWidth: 0, minHeight: 60, borderRadius: 20, alignItems: 'center', justifyContent: 'center', gap: 2 }}
    >
      <View
        style={[
          { width: 48, height: 32, borderRadius: 16, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
          active && palette.shadows && { shadowColor: '#0066E0', shadowOpacity: 0.35, shadowRadius: 14, shadowOffset: { width: 0, height: 6 } },
        ]}
      >
        {active ? (
          <LinearGradient colors={palette.tabActive} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }} />
        ) : null}
        <Icon name={icon} filled={active} size={24} color={active ? '#FFFFFF' : palette.inkMuted} />
      </View>
      <AppText size={14} weight={active ? 700 : 400} color={active ? palette.navy : palette.inkMuted} numberOfLines={1} lh={1.25}>
        {label}
      </AppText>
      {badge ? (
        <View
          style={{ position: 'absolute', top: 2, right: '50%', marginRight: -30, minWidth: 20, height: 20, paddingHorizontal: 5, borderRadius: 10, backgroundColor: '#C2185B', alignItems: 'center', justifyContent: 'center' }}
        >
          <AppText size={13} weight={700} color="#FFFFFF" lh={1.2} allowFontScaling={false}>
            {String(badge)}
          </AppText>
        </View>
      ) : null}
    </Pressable>
  );
}

/**
 * Estilo da área das telas (<TabSlot>). O padrão do expo-router é flexShrink 0:
 * no celular isso não pesa, mas na web a área cresce até a altura do conteúdo,
 * empurra a barra de abas para fora da tela e trava a rolagem. Aqui ela ocupa
 * só o espaço que sobra acima da barra.
 */
export const slotStyle: ViewStyle = { flexGrow: 1, flexShrink: 1, flexBasis: 0, minHeight: 0 };

/**
 * Barra de abas flutuante do design (branca, cantos de 26 px, sombra azul).
 * Uso: <TabList asChild><FloatingTabBar>…<TabTrigger/>…</FloatingTabBar></TabList>.
 * Os <TabTrigger> precisam estar escritos direto no layout (o expo-router os
 * descobre percorrendo o JSX), por isso a lista de abas fica em cada _layout.
 */
// O estilo que o <TabList asChild> injeta (linha, space-between) é ignorado de propósito: a moldura define o seu.
export function FloatingTabBar({ children }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const { palette } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={{ width: '100%', alignSelf: 'stretch', paddingHorizontal: 12, paddingBottom: Math.max(insets.bottom, 18), backgroundColor: palette.bg }}>
      <View
        accessibilityRole="tablist"
        style={[
          { flexDirection: 'row', padding: 6, borderRadius: 26, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.line },
          palette.shadows && { shadowColor: '#052A52', shadowOpacity: 0.14, shadowRadius: 28, shadowOffset: { width: 0, height: 10 }, elevation: 8 },
        ]}
      >
        {children}
      </View>
    </View>
  );
}

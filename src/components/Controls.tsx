import React from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/SettingsContext';
import { cardShadow, hero, levelStyle, reportStatusStyle } from '@/styles/theme';
import type { Level, ReportStatus } from '@/types';
import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';

/** Título de tela (Sora 24, marinho). */
export function ScreenTitle({ children, size = 24 }: { children: string; size?: number }) {
  const { palette } = useTheme();
  return (
    <AppText font="display" size={size} lh={1.25} color={palette.navy} accessibilityRole="header" style={{ marginHorizontal: 4 }}>
      {children}
    </AppText>
  );
}

/** Subtítulo de seção (Sora 18). */
export function SectionTitle({ children }: { children: string }) {
  return (
    <AppText font="display" size={18} lh={1.3} accessibilityRole="header" style={{ marginHorizontal: 4, marginTop: 4 }}>
      {children}
    </AppText>
  );
}

/** Quadrado com gradiente e ícone branco (ícones das listas e atalhos). */
export function IconBadge({
  icon,
  colors,
  size = 46,
  iconSize,
  radius,
  shadow,
  shadowColor = '#0052CC',
  filled,
}: {
  icon: IconName;
  colors: readonly [string, string];
  size?: number;
  iconSize?: number;
  radius?: number;
  shadow?: boolean;
  /** Cor da sombra (nos níveis, a cor `line`). */
  shadowColor?: string;
  filled?: boolean;
}) {
  const { palette } = useTheme();
  return (
    <View
      style={[
        { width: size, height: size, borderRadius: radius ?? Math.round(size / 3) },
        shadow && palette.shadows && { shadowColor, shadowOpacity: shadowColor === '#0052CC' ? 0.25 : 0.9, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 3 },
      ]}
    >
      <LinearGradient
        colors={palette.shadows ? colors : ['#000000', '#000000']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1, borderRadius: radius ?? Math.round(size / 3), alignItems: 'center', justifyContent: 'center' }}
      >
        <Icon name={icon} filled={filled} size={iconSize ?? Math.round(size * 0.56)} color="#FFFFFF" />
      </LinearGradient>
    </View>
  );
}

/**
 * Cartão de opção (radio) do design: branco com borda suave;
 * selecionado fica com gradiente azul e texto branco.
 */
export function SelectCard({
  selected,
  onPress,
  children,
  style,
  minHeight = 104,
  label,
}: {
  selected: boolean;
  onPress: () => void;
  children: (fg: string) => React.ReactNode;
  style?: StyleProp<ViewStyle>;
  minHeight?: number;
  label: string;
}) {
  const { palette } = useTheme();
  const fg = selected ? '#FFFFFF' : palette.ink;
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        { flex: 1, minHeight, borderRadius: 22, borderWidth: 2, borderColor: selected ? palette.selectedBorder : palette.line, backgroundColor: palette.surface, overflow: 'hidden' },
        pressed && { transform: [{ scale: 0.98 }] },
        style,
      ]}
    >
      {selected ? (
        <LinearGradient colors={palette.selected} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      ) : null}
      <View style={{ flex: 1, padding: 14, gap: 8, justifyContent: 'space-between' }}>{children(fg)}</View>
    </Pressable>
  );
}

/** Controle segmentado (abas pequenas): 7 dias / 24 h, Próximas horas / dias, Aguardando / Todos. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
  framed = true,
  stretch = true,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  label: string;
  /** Com borda e fundo branco (true) ou sobre o fundo da tela (false). */
  framed?: boolean;
  stretch?: boolean;
}) {
  const { palette } = useTheme();
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={label}
      style={{
        flexDirection: 'row',
        gap: 4,
        padding: 4,
        borderRadius: 16,
        backgroundColor: framed ? palette.surface : palette.bg,
        borderWidth: framed ? 1 : 0,
        borderColor: palette.line,
      }}
    >
      {options.map((o) => {
        const sel = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="radio"
            accessibilityState={{ checked: sel }}
            onPress={() => onChange(o.value)}
            style={{ flex: stretch ? 1 : undefined, minHeight: 44, borderRadius: 12, overflow: 'hidden', justifyContent: 'center' }}
          >
            {sel ? <LinearGradient colors={palette.button} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} /> : null}
            <AppText size={15} weight={700} align="center" color={sel ? '#FFFFFF' : palette.ink} style={{ paddingHorizontal: 14 }}>
              {o.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Interruptor do design: linha branca com ícone, título, estado por extenso e trilho de 56 × 34. */
export function SwitchRow({
  icon,
  label,
  value,
  onChange,
}: {
  icon: IconName;
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  const { palette, fontScale } = useTheme();
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value }}
      onPress={() => onChange(!value)}
      style={{
        minHeight: 68,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: palette.line,
        backgroundColor: palette.surface,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <Icon name={icon} size={28 * fontScale} color={palette.accent} />
      <View style={{ flex: 1 }}>
        <AppText weight={700}>{label}</AppText>
        <AppText size={14} muted>
          {value ? 'Ativado' : 'Desativado'}
        </AppText>
      </View>
      <View
        style={{
          width: 56,
          height: 34,
          borderRadius: 17,
          borderWidth: 2,
          borderColor: palette.navy,
          backgroundColor: value ? (palette.shadows ? palette.accent : '#000000') : palette.surface,
        }}
      >
        <View
          style={{
            position: 'absolute',
            top: 3,
            left: value ? 25 : 3,
            width: 24,
            height: 24,
            borderRadius: 12,
            backgroundColor: value ? '#FFFFFF' : palette.navy,
          }}
        />
      </View>
    </Pressable>
  );
}

/** Chip do ícone do nível: gradiente do nível, ícone branco preenchido e sombra na cor `line`. */
export function LevelBadge({ level, size = 46, iconSize, radius }: { level: Level; size?: number; iconSize?: number; radius?: number }) {
  const l = levelStyle[level];
  return <IconBadge icon={l.icon} colors={l.grad} size={size} iconSize={iconSize} radius={radius ?? Math.round(size / 2.9)} shadow shadowColor={l.line} filled />;
}

/**
 * Selo de estado do nível sobre o fundo escuro: vidro translúcido
 * (fundo branco 12 %, borda branca 30 %) e ícone na cor `glow` do nível.
 */
export function RiskChip({ level, size = 16 }: { level: Level; size?: number }) {
  const { fontScale } = useTheme();
  const l = levelStyle[level];
  return (
    <View
      accessible
      accessibilityLabel={`Estado: ${l.label}`}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingLeft: 8, paddingRight: 14, borderRadius: 20, backgroundColor: hero.glassBg, borderWidth: 1, borderColor: hero.glassBorder, alignSelf: 'flex-start' }}
    >
      <Icon name={l.icon} filled size={22 * fontScale} color={l.glow} />
      <AppText size={size} weight={700} color="#FFFFFF" lh={1.2}>
        {l.label}
      </AppText>
    </View>
  );
}

/** Cartão de nível: branco, borda fina, sombra suave, chip em gradiente e título na cor `fg`. */
export function LevelCard({
  level,
  title,
  subtitle,
  chip = 46,
  radius = 24,
  style,
  right,
  subtitleColor,
}: {
  level: Level;
  title: string;
  subtitle?: string;
  chip?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
  right?: React.ReactNode;
  subtitleColor?: string;
}) {
  const { palette } = useTheme();
  const l = levelStyle[level];
  return (
    <View
      style={[
        { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: radius, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.line },
        cardShadow(palette, 0.07),
        style,
      ]}
    >
      <LevelBadge level={level} size={chip} />
      <View style={{ flex: 1, gap: 2 }}>
        <AppText font="display" weight={700} color={palette.shadows ? l.fg : palette.ink} lh={1.3}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText size={subtitleColor ? 14 : 15} weight={subtitleColor ? 700 : 400} color={subtitleColor} muted={!subtitleColor}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {right}
    </View>
  );
}

/** Selo de situação do relato: Não verificado, Validado, Descartado. */
export function StatusChip({ status }: { status: ReportStatus }) {
  const { fontScale } = useTheme();
  const s = reportStatusStyle[status];
  return (
    <View
      accessible
      accessibilityLabel={`Situação: ${s.label}`}
      style={{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 3, paddingLeft: 6, paddingRight: 10, borderRadius: 20, backgroundColor: s.bg }}
    >
      <Icon name={s.icon} size={20 * fontScale} color={s.fg} />
      <AppText size={14} weight={700} color={s.fg} lh={1.2}>
        {s.label}
      </AppText>
    </View>
  );
}

/** Pílula translúcida do palco escuro (profundidade, tendência, chuva). */
export function StageChip({ icon, label, iconColor }: { icon: IconName; label: string; iconColor: string }) {
  const { fontScale } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4, paddingLeft: 6, paddingRight: 10, borderRadius: 14, backgroundColor: 'rgba(124,243,255,0.14)' }}>
      <Icon name={icon} size={22 * fontScale} color={iconColor} />
      <AppText size={14} color="#FFFFFF" lh={1.2}>
        {label}
      </AppText>
    </View>
  );
}

/** Linha tracejada com ícone (avisos discretos e estados vazios). */
export function DashedNote({ icon, children, iconColor }: { icon: IconName; children: string; iconColor?: string }) {
  const { palette, fontScale } = useTheme();
  return (
    <View style={{ padding: 14, borderRadius: 18, borderWidth: 1, borderStyle: 'dashed', borderColor: palette.border, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <Icon name={icon} size={24 * fontScale} color={iconColor ?? palette.inkMuted} />
      <AppText size={14} muted style={{ flex: 1 }}>
        {children}
      </AppText>
    </View>
  );
}

/** Atalho grande da tela inicial: ícone em gradiente e rótulo em Sora. */
export function ShortcutTile({ icon, colors, label, onPress }: { icon: IconName; colors: readonly [string, string]; label: string; onPress: () => void }) {
  const { palette } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        { flex: 1, minHeight: 104, padding: 14, borderRadius: 22, borderWidth: 1, borderColor: palette.line, backgroundColor: palette.surface, justifyContent: 'space-between', gap: 10 },
        cardShadow(palette),
        pressed && { transform: [{ scale: 0.97 }] },
      ]}
    >
      <IconBadge icon={icon} colors={colors} size={46} iconSize={26} radius={15} shadow />
      <AppText font="display" weight={600} lh={1.25}>
        {label}
      </AppText>
    </Pressable>
  );
}

/** Bloco de dados brutos (JSON) em JetBrains Mono, como no design. */
export function JsonBlock({ value }: { value: unknown }) {
  return (
    <View style={{ padding: 16, borderRadius: 18, backgroundColor: '#041D3A', borderWidth: 1, borderColor: 'rgba(124,243,255,0.3)' }}>
      <AppText font="mono" size={14} lh={1.55} color="#9AF6FF" selectable>
        {JSON.stringify(value, null, 2)}
      </AppText>
    </View>
  );
}

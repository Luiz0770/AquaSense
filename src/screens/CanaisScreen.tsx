import React from 'react';
import { Linking, Pressable, View } from 'react-native';
import { useTheme } from '@/contexts/SettingsContext';
import { dataSources, officialChannels } from '@/data/history';
import { LEVEL_ORDER } from '@/services/iot/thresholds';
import { glowShadow, gradients, levelStyle, stage } from '@/styles/theme';
import { AppText } from '@/components/AppText';
import { IconBadge, ScreenTitle, SectionTitle } from '@/components/Controls';
import { Icon, type IconName } from '@/components/Icon';
import { Screen } from '@/components/Screen';
import { Gradient, StageCard } from '@/components/Surfaces';

const open = (url: string) => {
  Linking.openURL(url).catch(() => {
    // Sem app para abrir o link: o número e o site continuam escritos na tela.
  });
};

const CHANNELS: { title: string; icon: IconName; colors: readonly [string, string]; href: string; hint: string }[] = [
  { title: 'SMS 40199', icon: 'sms', colors: gradients.sensor, href: officialChannels.defesaCivilSms, hint: 'Cadastre seu CEP para receber alertas da Defesa Civil' },
  { title: 'CGE', icon: 'public', colors: gradients.report, href: officialChannels.cgeUrl, hint: 'Abre o site do Centro de Gerenciamento de Emergências' },
  { title: 'Bombeiros 193', icon: 'local_fire_department', colors: gradients.history, href: officialChannels.bombeirosTel, hint: 'Liga para o Corpo de Bombeiros' },
];

const SOURCE_ICONS: IconName[] = ['memory', 'public', 'rainy', 'water', 'forum'];

/** Canais oficiais, origem dos dados e legenda das faixas. */
export function CanaisScreen() {
  const { palette, fontScale } = useTheme();
  return (
    <Screen>
      <ScreenTitle>Canais oficiais</ScreenTitle>

      <StageCard radius={24} padding={16} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: 'rgba(124,243,255,0.18)', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="shield" size={28} color={stage.cyan} />
        </View>
        <AppText color="#FFFFFF" style={{ flex: 1 }}>
          O AquaSense não substitui a Defesa Civil nem o CGE. Para decisões de segurança, siga os canais oficiais.
        </AppText>
      </StageCard>

      <Pressable
        onPress={() => open(officialChannels.defesaCivilTel)}
        accessibilityRole="link"
        accessibilityLabel="Ligar para a Defesa Civil, 199. Gratuito, 24 horas."
        style={({ pressed }) => [{ borderRadius: 24 }, glowShadow(palette, '#0052CC', 0.35, 26, 12), pressed && { transform: [{ scale: 0.98 }] }]}
      >
        <Gradient colors={palette.button} style={{ minHeight: 88, padding: 16, borderRadius: 24, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <View style={{ width: 56, height: 56, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="call" filled size={30} color="#FFFFFF" />
          </View>
          <View style={{ flex: 1 }}>
            <AppText font="display" size={22} color="#FFFFFF" lh={1.25}>
              Defesa Civil · 199
            </AppText>
            <AppText size={14} color={stage.muted2}>
              Gratuito, 24 horas
            </AppText>
          </View>
        </Gradient>
      </Pressable>

      <View style={{ flexDirection: 'row', gap: 10 }}>
        {CHANNELS.map((c) => (
          <Pressable
            key={c.title}
            onPress={() => open(c.href)}
            accessibilityRole="link"
            accessibilityLabel={c.title}
            accessibilityHint={c.hint}
            style={({ pressed }) => ({
              flex: 1,
              minHeight: 112,
              paddingVertical: 12,
              paddingHorizontal: 10,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: palette.line,
              backgroundColor: palette.surface,
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transform: pressed ? [{ scale: 0.97 }] : [],
            })}
          >
            <IconBadge icon={c.icon} colors={c.colors} size={44} iconSize={24} radius={14} />
            <AppText size={14} weight={700} lh={1.2} align="center">
              {c.title}
            </AppText>
          </Pressable>
        ))}
      </View>

      <SectionTitle>Sobre os dados</SectionTitle>
      <View style={{ backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.line, borderRadius: 22, paddingVertical: 6, paddingHorizontal: 14 }}>
        {dataSources.map((d, i) => (
          <View
            key={d.nome}
            accessible
            style={{ minHeight: 56, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: i < dataSources.length - 1 ? 1 : 0, borderBottomColor: palette.line }}
          >
            <Icon name={SOURCE_ICONS[i] ?? 'insights'} size={24 * fontScale} color={palette.accent} />
            <View style={{ flex: 1 }}>
              <AppText size={15} weight={700}>
                {d.nome}
              </AppText>
              <AppText size={14} muted>
                {d.descricao}
              </AppText>
            </View>
          </View>
        ))}
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {LEVEL_ORDER.map((k) => {
          const l = levelStyle[k];
          return (
            <View
              key={k}
              accessible
              accessibilityLabel={`${l.label}: ${l.range}`}
              style={{ flexBasis: '48%', flexGrow: 1, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 16, backgroundColor: l.bg, borderWidth: 2, borderColor: l.fg, flexDirection: 'row', alignItems: 'center', gap: 8 }}
            >
              <Icon name={l.icon} filled size={24 * fontScale} color={l.fg} />
              <View style={{ flexShrink: 1 }}>
                <AppText weight={700} color={l.fg}>
                  {l.label}
                </AppText>
                <AppText size={14} color={palette.ink}>
                  {l.range}
                </AppText>
              </View>
            </View>
          );
        })}
      </View>
      <AppText size={14} muted style={{ paddingHorizontal: 4 }}>
        Limiares de demonstração, ainda não confirmados com o circuito do sensor.
      </AppText>
    </Screen>
  );
}

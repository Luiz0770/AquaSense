import React from 'react';
import { Pressable, ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useMonitoring } from '@/contexts/MonitoringContext';
import { useTheme } from '@/contexts/SettingsContext';
import { cardShadow, hero as heroTheme } from '@/styles/theme';
import { AlertBanner } from './AlertBanner';
import { AppText } from './AppText';
import { Icon } from './Icon';
import { LogoMark, Wordmark } from './Logo';
import { FadeIn } from './motion';

interface Props {
  children: React.ReactNode;
  /** Faixa "Estimativa não oficial" acima da barra de abas (Início, Histórico, Sensor, Painel, Simulação). */
  notice?: boolean;
  /** Tela fora das abas (Perfil): seta de voltar no lugar do botão de perfil. */
  back?: boolean;
  /** Tela inicial: cabeçalho e status bar azul-marinho, marca e perfil em branco. */
  hero?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
}

/** Caminho da tela de canais oficiais para o perfil logado. */
export function useSourcesHref() {
  const { user } = useAuth();
  return user?.role === 'agente' ? ('/canais' as const) : ('/fontes' as const);
}

/**
 * Estrutura das telas logadas, como no design: marca + perfil no topo,
 * aviso de mudança de estado, conteúdo rolável e a faixa de aviso fixa.
 */
export function Screen({ children, notice = false, back = false, hero = false, contentStyle }: Props) {
  const { palette } = useTheme();
  const { user } = useAuth();
  const { banner, dismissBanner } = useMonitoring();
  const router = useRouter();
  const sources = useSourcesHref();
  const hd = hero
    ? { t: '#FFFFFF', chipBg: 'rgba(255,255,255,0.16)', chipFg: '#FFFFFF', btnBd: heroTheme.glassBorder, btnBg: heroTheme.glassBg, btnFg: '#FFFFFF' }
    : { t: palette.navy, chipBg: palette.accentBg, chipFg: palette.navy, btnBd: palette.line, btnBg: palette.surface, btnFg: palette.navy };

  return (
    <View style={[styles.root, { backgroundColor: palette.bg }]}>
      <StatusBar style={hero ? 'light' : 'dark'} />
      <SafeAreaView edges={back ? ['top', 'bottom'] : ['top']} style={[styles.root, hero && { backgroundColor: heroTheme.head }]}>
        <View style={hero ? { backgroundColor: heroTheme.head } : undefined}>
        {banner ? (
          <AlertBanner
            level={banner.para}
            nivelCm={banner.nivelCm}
            onClose={dismissBanner}
            onSources={() => {
              dismissBanner();
              router.push(sources);
            }}
          />
        ) : null}

        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 1 }}>
            {back ? (
              <Pressable
                onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
                accessibilityRole="button"
                accessibilityLabel="Voltar"
                style={{ width: 44, height: 48, marginLeft: -8, alignItems: 'center', justifyContent: 'center' }}
              >
                <Icon name="arrow_back" size={26} color={hd.t} />
              </Pressable>
            ) : null}
            <LogoMark size={28} />
            <Wordmark size={18} onDark={hero} />
            <View style={{ paddingHorizontal: 10, paddingVertical: 2, borderRadius: 20, backgroundColor: hd.chipBg, borderWidth: palette.shadows || hero ? 0 : 1, borderColor: palette.line }}>
              <AppText size={14} weight={700} color={hd.chipFg} lh={1.4}>
                {user?.role === 'agente' ? 'Agente' : 'Cidadão'}
              </AppText>
            </View>
          </View>
          {!back ? (
            <Pressable
              onPress={() => router.push('/perfil')}
              accessibilityRole="button"
              accessibilityLabel="Perfil e acessibilidade"
              style={[
                { width: 48, height: 48, borderRadius: 16, borderWidth: 1, borderColor: hd.btnBd, backgroundColor: hd.btnBg, alignItems: 'center', justifyContent: 'center' },
                !hero && cardShadow(palette, 0.08),
              ]}
            >
              <Icon name="person" size={26} color={hd.btnFg} />
            </Pressable>
          ) : null}
        </View>
        </View>

        <ScrollView
          style={[styles.root, { backgroundColor: palette.bg }]}
          contentContainerStyle={{ paddingTop: 6, paddingHorizontal: 16, paddingBottom: 20 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <FadeIn style={[{ gap: 14 }, contentStyle]}>{children}</FadeIn>
        </ScrollView>

        {notice ? (
          <View style={{ backgroundColor: palette.bg }}>
          <View style={[styles.notice, { backgroundColor: palette.accentBg, borderColor: palette.accent }]}>
            <Icon name="info" size={20} color={palette.accent} />
            <AppText size={14} lh={1.25} style={{ flex: 1 }}>
              Estimativa não oficial · simulado. Não substitui Defesa Civil (199) e CGE.
            </AppText>
            <Pressable
              onPress={() => router.push(sources)}
              accessibilityRole="link"
              accessibilityLabel="Fontes e canais oficiais"
              style={{ minHeight: 48, paddingHorizontal: 8, justifyContent: 'center' }}
            >
              <AppText size={14} weight={700} color={palette.navy} style={{ textDecorationLine: 'underline' }}>
                Fontes
              </AppText>
            </Pressable>
          </View>
          </View>
        ) : null}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 2,
    paddingBottom: 6,
    paddingLeft: 20,
    paddingRight: 14,
  },
  notice: {
    marginHorizontal: 12,
    marginBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
    paddingLeft: 12,
    paddingRight: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
});

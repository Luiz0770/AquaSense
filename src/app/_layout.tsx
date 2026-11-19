import React, { useEffect } from 'react';
import { Platform, View } from 'react-native';
import { Stack, useRootNavigationState, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { AtkinsonHyperlegible_400Regular, AtkinsonHyperlegible_700Bold } from '@expo-google-fonts/atkinson-hyperlegible';
import { Sora_500Medium, Sora_600SemiBold, Sora_700Bold } from '@expo-google-fonts/sora';
import { JetBrainsMono_400Regular, JetBrainsMono_600SemiBold } from '@expo-google-fonts/jetbrains-mono';
import { SettingsProvider, useTheme } from '@/contexts/SettingsContext';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { MonitoringProvider, useMonitoring } from '@/contexts/MonitoringContext';
import { LocationProvider } from '@/contexts/LocationContext';

void SplashScreen.preventAutoHideAsync();

/**
 * Proteção de rotas por perfil:
 * sem sessão -> (auth); cidadão -> (tabs); agente -> (agente).
 */
function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { loaded } = useTheme();
  const { ready } = useMonitoring();
  const segments = useSegments();
  const router = useRouter();
  const navState = useRootNavigationState();

  useEffect(() => {
    if (!navState?.key || loading) return;
    const group = segments[0] as string | undefined;
    if (!user) {
      if (group !== '(auth)') router.replace('/login');
      return;
    }
    const home = user.role === 'agente' ? '/painel' : '/';
    if (group === '(auth)') router.replace(home);
    else if (user.role === 'agente' && group === '(tabs)') router.replace('/painel');
    else if (user.role === 'cidadao' && group === '(agente)') router.replace('/');
  }, [navState?.key, loading, user, segments, router]);

  const hide = !loading && loaded && ready;
  useEffect(() => {
    if (hide) void SplashScreen.hideAsync();
  }, [hide]);

  return hide ? <>{children}</> : null;
}

/**
 * Na web o app roda dentro de uma coluna com largura de celular, centralizada.
 * Sem isso, num navegador de computador as telas esticam na largura toda.
 */
const WEB_FRAME_MAX = 480;

function Shell() {
  const { palette } = useTheme();
  const web = Platform.OS === 'web';
  return (
    <View style={{ flex: 1, backgroundColor: web ? palette.line : palette.bg }}>
      <View style={web ? { flex: 1, width: '100%', maxWidth: WEB_FRAME_MAX, alignSelf: 'center', backgroundColor: palette.bg } : { flex: 1 }}>
      <AuthGate>
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: palette.bg } }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="(agente)" />
          <Stack.Screen name="perfil" />
          <Stack.Screen name="location" />
          <Stack.Screen name="relato/[id]" />
        </Stack>
      </AuthGate>
      </View>
    </View>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    AtkinsonHyperlegible_400Regular,
    AtkinsonHyperlegible_700Bold,
    Sora_500Medium,
    Sora_600SemiBold,
    Sora_700Bold,
    JetBrainsMono_400Regular,
    JetBrainsMono_600SemiBold,
  });

  // Se a fonte falhar, o app abre com a fonte do sistema em vez de ficar travado.
  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <SettingsProvider>
        <AuthProvider>
          <MonitoringProvider>
            <LocationProvider>
              <Shell />
            </LocationProvider>
          </MonitoringProvider>
        </AuthProvider>
      </SettingsProvider>
    </SafeAreaProvider>
  );
}

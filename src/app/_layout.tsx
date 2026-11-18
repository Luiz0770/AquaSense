import React, { useEffect } from 'react';
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

function Shell() {
  const { palette } = useTheme();
  return (
    <>
      <AuthGate>
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: palette.bg } }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="(agente)" />
          <Stack.Screen name="perfil" />
          <Stack.Screen name="location" />
        </Stack>
      </AuthGate>
    </>
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

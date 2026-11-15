import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/SettingsContext';
import { AuthError, DEMO_CITIZEN } from '@/services/authService';
import { validateEmail } from '@/utils/validators';
import { stage } from '@/styles/theme';
import { AppText, ErrorText } from '@/components/AppText';
import { AuthHero } from '@/components/AuthHero';
import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { LogoMark, Wordmark } from '@/components/Logo';
import { FadeIn } from '@/components/motion';
import { TextField } from '@/components/TextField';

export default function LoginScreen() {
  const { palette, fontScale } = useTheme();
  const { signIn, signInDemoAgent } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string | null; password?: string | null; form?: string | null }>({});
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const e = {
      email: validateEmail(email),
      password: password ? null : 'Digite sua senha.',
    };
    setErrors(e);
    if (e.email || e.password) return;
    setBusy(true);
    try {
      await signIn(email, password);
      // O redirecionamento por perfil acontece no AuthGate.
    } catch (err) {
      if (err instanceof AuthError) setErrors({ [err.field]: err.message });
      else setErrors({ form: 'Não foi possível entrar agora. Tente de novo.' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: palette.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
        <AuthHero>
          <View style={{ height: 290, alignItems: 'center', paddingTop: 28, gap: 14 }}>
            <View style={{ marginTop: 8 }}>
              <LogoMark size={86} big />
            </View>
            <View style={{ marginTop: 8 }}>
              <Wordmark size={34} onDark />
            </View>
            <AppText color={stage.muted2}>Chuva e alagamentos, em tempo real</AppText>
          </View>
        </AuthHero>

        <FadeIn durationMs={400} style={{ paddingTop: 8, paddingHorizontal: 24, paddingBottom: 28, gap: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 16, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.line }}>
            <Icon name="shield" size={24 * fontScale} color={palette.accent} />
            <AppText size={14} style={{ flex: 1 }}>
              Não substitui os alertas oficiais da Defesa Civil (199) e do CGE.
            </AppText>
          </View>

          <TextField
            label="E-mail"
            value={email}
            onChangeText={(v) => {
              setEmail(v);
              setErrors((p) => ({ ...p, email: null, form: null }));
            }}
            placeholder="nome@exemplo.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            error={errors.email}
          />
          <View style={{ gap: 6 }}>
            <TextField
              label="Senha"
              value={password}
              onChangeText={(v) => {
                setPassword(v);
                setErrors((p) => ({ ...p, password: null, form: null }));
              }}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="current-password"
              error={errors.password}
              returnKeyType="go"
              onSubmitEditing={submit}
            />
            <AppText size={14} muted>{`Demo: ${DEMO_CITIZEN.email} · senha ${DEMO_CITIZEN.password}`}</AppText>
          </View>
          {errors.form ? <ErrorText>{errors.form}</ErrorText> : null}

          <Button label={busy ? 'Entrando...' : 'Entrar'} onPress={submit} disabled={busy} />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Button label="Criar conta" variant="outline" style={{ flex: 1 }} onPress={() => router.push('/cadastro')} />
            <Button
              label="Ver como agente (demonstração)"
              icon="badge"
              variant="soft"
              style={{ flex: 1 }}
              onPress={() => void signInDemoAgent()}
            />
          </View>
        </FadeIn>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

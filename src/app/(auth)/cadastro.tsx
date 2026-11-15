import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/SettingsContext';
import { AuthError } from '@/services/authService';
import type { Role } from '@/types';
import { maskPhone } from '@/utils/masks';
import { validateEmail, validateName, validatePassword, validatePhone, type Validation } from '@/utils/validators';
import { stage } from '@/styles/theme';
import { AppText, ErrorText } from '@/components/AppText';
import { AuthHero } from '@/components/AuthHero';
import { Button } from '@/components/Button';
import { SelectCard } from '@/components/Controls';
import { Icon, type IconName } from '@/components/Icon';
import { FadeIn } from '@/components/motion';
import { TextField } from '@/components/TextField';

type Errors = Partial<Record<'name' | 'email' | 'phone' | 'password' | 'role' | 'form', Validation>>;

const PERFIS: { id: Role; label: string; desc: string; icon: IconName }[] = [
  { id: 'cidadao', label: 'Cidadão', desc: 'Consulto e relato', icon: 'person' },
  { id: 'agente', label: 'Agente', desc: 'Valido e simulo', icon: 'badge' },
];

export default function CadastroScreen() {
  const { palette, fontScale } = useTheme();
  const { signUp } = useAuth();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role | null>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);

  const clear = (k: keyof Errors) => setErrors((p) => ({ ...p, [k]: null, form: null }));

  const submit = async () => {
    const e: Errors = {
      role: role ? null : 'Escolha um perfil.',
      name: validateName(name),
      email: validateEmail(email),
      phone: validatePhone(phone),
      password: validatePassword(password),
    };
    setErrors(e);
    if (Object.values(e).some(Boolean) || !role) return;
    setBusy(true);
    try {
      await signUp({ name, email, phone, password, role });
      // O AuthGate leva cada perfil para a sua tela inicial.
    } catch (err) {
      if (err instanceof AuthError) setErrors({ [err.field]: err.message });
      else setErrors({ form: 'Não foi possível criar a conta agora. Tente de novo.' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: palette.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <AuthHero glow={false}>
          <View style={{ paddingTop: 4, paddingHorizontal: 20, paddingBottom: 64, gap: 6 }}>
            <Pressable
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/login'))}
              accessibilityRole="button"
              accessibilityLabel="Voltar"
              style={{ width: 48, height: 48, marginLeft: -8, alignItems: 'center', justifyContent: 'center' }}
            >
              <Icon name="arrow_back" size={28} color="#FFFFFF" />
            </Pressable>
            <AppText font="display" size={28} color="#FFFFFF" lh={1.25} accessibilityRole="header">
              Criar conta
            </AppText>
            <AppText color={stage.muted2}>Sem CPF e sem endereço da sua casa.</AppText>
          </View>
        </AuthHero>

        <FadeIn durationMs={400} style={{ paddingTop: 4, paddingHorizontal: 24, paddingBottom: 28, gap: 16 }}>
          <View style={{ gap: 8 }}>
            <AppText weight={700}>Perfil</AppText>
            <View accessibilityRole="radiogroup" accessibilityLabel="Perfil" style={{ flexDirection: 'row', gap: 10 }}>
              {PERFIS.map((p) => (
                <SelectCard
                  key={p.id}
                  label={`${p.label}: ${p.desc}`}
                  selected={role === p.id}
                  minHeight={112}
                  onPress={() => {
                    setRole(p.id);
                    clear('role');
                  }}
                >
                  {(fg) => (
                    <>
                      <Icon name={p.icon} size={32 * fontScale} color={fg} />
                      <View>
                        <AppText font="display" weight={700} color={fg}>
                          {p.label}
                        </AppText>
                        <AppText size={14} color={fg}>
                          {p.desc}
                        </AppText>
                      </View>
                    </>
                  )}
                </SelectCard>
              ))}
            </View>
            {errors.role ? <ErrorText>{errors.role}</ErrorText> : null}
          </View>

          <TextField
            label="Nome"
            value={name}
            onChangeText={(v) => {
              setName(v);
              clear('name');
            }}
            autoComplete="name"
            error={errors.name}
          />
          <TextField
            label="E-mail"
            value={email}
            onChangeText={(v) => {
              setEmail(v);
              clear('email');
            }}
            placeholder="nome@exemplo.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            error={errors.email}
          />
          <TextField
            label="Celular"
            mono
            value={phone}
            onChangeText={(v) => {
              setPhone(maskPhone(v));
              clear('phone');
            }}
            placeholder="(11) 90000-0000"
            keyboardType="phone-pad"
            autoComplete="tel"
            maxLength={15}
            error={errors.phone}
          />
          <TextField
            label="Senha"
            labelHint="(mín. 6)"
            value={password}
            onChangeText={(v) => {
              setPassword(v);
              clear('password');
            }}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="new-password"
            error={errors.password}
          />
          {errors.form ? <ErrorText>{errors.form}</ErrorText> : null}
          <Button label={busy ? 'Criando...' : 'Criar conta'} onPress={submit} disabled={busy} />
        </FadeIn>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

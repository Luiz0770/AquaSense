import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useMonitoring } from '@/contexts/MonitoringContext';
import { useTheme } from '@/contexts/SettingsContext';
import { useReportForm } from '@/hooks/useReportForm';
import { pilotPoint } from '@/data/pilotPoint';
import { formatTime } from '@/utils/format';
import type { ReportKind } from '@/types';
import { kindIcon, REPORT_KINDS } from '@/data/reportKinds';
import { gradients } from '@/styles/theme';
import { AppText, ErrorText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { ScreenTitle, SectionTitle, SelectCard, StatusChip } from '@/components/Controls';
import { Icon } from '@/components/Icon';
import { FadeIn } from '@/components/motion';
import { Screen } from '@/components/Screen';
import { Gradient } from '@/components/Surfaces';
import { TextField } from '@/components/TextField';

const MAX_DESC = 280;

export default function RelatarScreen() {
  const { palette, fontScale } = useTheme();
  const { user } = useAuth();
  const { addReport, reports } = useMonitoring();
  const form = useReportForm();
  const [tipo, setTipo] = useState<ReportKind | null>(null);
  const [tipoErr, setTipoErr] = useState<string | null>(null);
  const [foto, setFoto] = useState(false);
  const [sent, setSent] = useState(false);
  const mine = reports.filter((r) => r.autorId && r.autorId === user?.id);

  const send = () => {
    const tErr = tipo ? null : 'Escolha o que você está vendo.';
    setTipoErr(tErr);
    const data = form.submit();
    if (!data || tErr || !tipo) return;
    addReport({ ...data, tipo, comFoto: foto });
    form.reset();
    setTipo(null);
    setFoto(false);
    setSent(true);
  };

  return (
    <Screen>
      <View style={{ gap: 2, paddingHorizontal: 4 }}>
        <ScreenTitle>O que você vê?</ScreenTitle>
        <AppText muted style={{ marginHorizontal: 4 }}>
          Fica como não verificado até um agente revisar.
        </AppText>
      </View>

      {sent ? (
        <FadeIn durationMs={400}>
          <Gradient colors={gradients.teal} style={{ padding: 20, borderRadius: 24, alignItems: 'center', gap: 10 }}>
            <View accessibilityRole="alert" accessibilityLiveRegion="polite" style={{ alignItems: 'center', gap: 10 }}>
              <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="task_alt" filled size={38} color="#FFFFFF" />
              </View>
              <AppText font="display" size={20} color="#FFFFFF">
                Relato enviado
              </AppText>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Icon name="schedule" size={20 * fontScale} color="#FFFFFF" />
                <AppText color="#FFFFFF">Não verificado</AppText>
              </View>
            </View>
            <Button label="Novo relato" variant="white" height={48} onPress={() => setSent(false)} />
          </Gradient>
        </FadeIn>
      ) : (
        <>
          <View accessibilityRole="radiogroup" accessibilityLabel="Tipo de relato" style={{ gap: 10 }}>
            {[0, 2].map((row) => (
              <View key={row} style={{ flexDirection: 'row', gap: 10 }}>
                {REPORT_KINDS.slice(row, row + 2).map((t) => (
                  <SelectCard
                    key={t.kind}
                    label={t.kind}
                    selected={tipo === t.kind}
                    onPress={() => {
                      setTipo(t.kind);
                      setTipoErr(null);
                    }}
                  >
                    {(fg) => (
                      <>
                        <Icon name={t.icon} size={36 * fontScale} color={fg} />
                        <AppText font="display" weight={600} color={fg}>
                          {t.kind}
                        </AppText>
                      </>
                    )}
                  </SelectCard>
                ))}
              </View>
            ))}
          </View>
          {tipoErr ? <ErrorText>{tipoErr}</ErrorText> : null}

          <Pressable
            onPress={() => setFoto((v) => !v)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: foto }}
            accessibilityLabel={foto ? 'Foto anexada (demonstração). Toque para remover.' : 'Adicionar foto (opcional)'}
            style={{
              minHeight: 72,
              paddingHorizontal: 16,
              borderRadius: 20,
              borderWidth: 2,
              borderStyle: 'dashed',
              borderColor: foto ? palette.accent : palette.border,
              backgroundColor: foto ? palette.accentBg : palette.surface,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <Icon name={foto ? 'image' : 'add_a_photo'} size={32 * fontScale} color={palette.accent} />
            <AppText weight={700} style={{ flex: 1 }}>
              {foto ? 'Foto anexada (demonstração)' : 'Adicionar foto (opcional)'}
            </AppText>
          </Pressable>

          <TextField
            label="Onde? (CEP)"
            mono
            value={form.cep}
            onChangeText={form.setCep}
            keyboardType="number-pad"
            maxLength={9}
            placeholder="00000-000"
            hint="Só o CEP do local. Não informe o endereço da sua casa."
            error={form.errors.cep}
            right={
              <Pressable
                onPress={() => form.setCep(pilotPoint.cep)}
                accessibilityRole="button"
                accessibilityLabel={`Usar o CEP do ${pilotPoint.name}`}
                style={{ width: 54, height: 54, borderRadius: 16, backgroundColor: palette.accentBg, alignItems: 'center', justifyContent: 'center' }}
              >
                <Icon name="my_location" size={26} color={palette.accent} />
              </Pressable>
            }
          />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 3 }}>
              <TextField
                label="Quando?"
                mono
                value={form.dataHora}
                onChangeText={form.setDataHora}
                keyboardType="number-pad"
                maxLength={16}
                accessibilityHint="Data e hora no formato dd/mm/aaaa hh:mm"
                error={form.errors.dataHora}
              />
            </View>
            <View style={{ flex: 2 }}>
              <TextField
                label="Altura (cm)"
                mono
                value={form.altura}
                onChangeText={form.setAltura}
                keyboardType="number-pad"
                maxLength={3}
                placeholder="15"
                accessibilityHint="Altura aproximada da água em centímetros"
                error={form.errors.altura}
              />
            </View>
          </View>
          <TextField
            label="Detalhes"
            labelHint={`${form.descricao.length}/${MAX_DESC}`}
            value={form.descricao}
            onChangeText={form.setDescricao}
            multiline
            maxLength={MAX_DESC}
            placeholder="Ex.: água cobrindo a calçada"
          />
          <Button label="Enviar relato" icon="send" onPress={send} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Icon name="call" size={20 * fontScale} color={palette.inkMuted} />
            <AppText size={14} muted style={{ flex: 1 }}>
              Em risco, ligue para a Defesa Civil (199).
            </AppText>
          </View>
        </>
      )}

      {mine.length > 0 ? (
        <>
          <SectionTitle>Meus relatos</SectionTitle>
          {mine.map((r) => (
            <View
              key={r.id}
              style={{ backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.line, borderRadius: 20, paddingVertical: 12, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}
            >
              <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: palette.accentBg, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={kindIcon(r.tipo)} size={24} color={palette.accent} />
              </View>
              <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
                <AppText weight={700}>{`${r.tipo ?? 'Relato'} · ${formatTime(r.observadoEm)}`}</AppText>
                <StatusChip status={r.status} />
              </View>
            </View>
          ))}
        </>
      ) : null}
    </Screen>
  );
}

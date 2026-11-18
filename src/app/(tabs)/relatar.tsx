import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useMonitoring } from '@/contexts/MonitoringContext';
import { useTheme } from '@/contexts/SettingsContext';
import { useReportForm } from '@/hooks/useReportForm';
import { pilotPoint } from '@/data/pilotPoint';
import { formatTime } from '@/utils/format';
import type { Report, ReportKind } from '@/types';
import { kindIcon, REPORT_KINDS } from '@/data/reportKinds';
import { gradients, stage } from '@/styles/theme';
import { AppText, ErrorText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { ScreenTitle, SectionTitle, SelectCard, StatusChip } from '@/components/Controls';
import { Icon } from '@/components/Icon';
import { FadeIn } from '@/components/motion';
import { Screen } from '@/components/Screen';
import { Gradient, StageCard } from '@/components/Surfaces';
import { TextField } from '@/components/TextField';

const MAX_DESC = 280;

type Mode = 'hub' | 'form';

/** Card de um relato próprio, igual ao que existia no formulário. */
function MyReportCard({ report }: { report: Report }) {
  const { palette } = useTheme();
  return (
    <View
      style={{ backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.line, borderRadius: 20, paddingVertical: 12, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}
    >
      <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: palette.accentBg, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={kindIcon(report.tipo)} size={24} color={palette.accent} />
      </View>
      <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
        <AppText weight={700}>{`${report.tipo ?? 'Relato'} · ${report.cep} · ${formatTime(report.observadoEm)}`}</AppText>
        <StatusChip status={report.status} />
      </View>
    </View>
  );
}

/** Hub da aba Relatar: atalho para o formulário, telefone de emergência e os relatos do usuário. */
function ReportHub({ mine, onNewReport }: { mine: Report[]; onNewReport: () => void }) {
  const { palette, fontScale } = useTheme();
  const recent = mine.slice(0, 5);
  return (
    <>
      <View style={{ gap: 2, paddingHorizontal: 4 }}>
        <ScreenTitle>Relatar</ScreenTitle>
        <AppText muted style={{ marginHorizontal: 4 }}>
          Viu água subindo ou rua alagada? Avise a comunidade.
        </AppText>
      </View>

      <StageCard radius={24} padding={18} style={{ gap: 12 }}>
        <View style={{ width: 56, height: 56, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="add_a_photo" size={30} color="#FFFFFF" />
        </View>
        <AppText font="display" size={20} color="#FFFFFF">
          Fazer um relato
        </AppText>
        <AppText color={stage.muted2}>Leva menos de um minuto. Um agente revisa seu relato antes de ele ser confirmado.</AppText>
        <Button label="Novo relato" icon="fact_check" variant="white" height={56} onPress={onNewReport} />
      </StageCard>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 20, backgroundColor: palette.accentBg }}>
        <Icon name="call" size={24 * fontScale} color={palette.accent} />
        <AppText weight={700} color={palette.navy} style={{ flex: 1 }}>
          Em risco imediato, ligue para a Defesa Civil (199).
        </AppText>
      </View>

      <SectionTitle>Seus últimos relatos</SectionTitle>
      {recent.length > 0 ? (
        recent.map((r) => <MyReportCard key={r.id} report={r} />)
      ) : (
        <View
          style={{
            minHeight: 120,
            padding: 18,
            borderRadius: 20,
            borderWidth: 2,
            borderStyle: 'dashed',
            borderColor: palette.border,
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}
        >
          <Icon name="hourglass_empty" size={32 * fontScale} color={palette.inkMuted} />
          <AppText font="display" weight={600} size={16} align="center">
            Nenhum relato até o momento
          </AppText>
          <AppText size={14} muted align="center">
            Quando você enviar um relato, ele aparece aqui com o status da revisão.
          </AppText>
        </View>
      )}
    </>
  );
}

export default function RelatarScreen() {
  const { palette, fontScale } = useTheme();
  const { user } = useAuth();
  const { addReport, reports } = useMonitoring();
  const form = useReportForm();
  const [mode, setMode] = useState<Mode>('hub');
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

  const goHub = () => {
    setSent(false);
    setMode('hub');
  };

  return (
    <Screen key={mode}>
      {mode === 'hub' ? (
        <ReportHub mine={mine} onNewReport={() => setMode('form')} />
      ) : (
        <>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 4 }}>
            <Pressable
              onPress={goHub}
              accessibilityRole="button"
              accessibilityLabel="Voltar para Relatar"
              hitSlop={8}
              style={{ width: 40, height: 44, alignItems: 'center', justifyContent: 'center', marginLeft: -8 }}
            >
              <Icon name="arrow_back" size={24} color={palette.navy} />
            </Pressable>
            <View style={{ flex: 1, gap: 2 }}>
              <ScreenTitle>O que você vê?</ScreenTitle>
              {!sent ? (
                <AppText muted style={{ marginHorizontal: 4 }}>
                  Fica como não verificado até um agente revisar.
                </AppText>
              ) : null}
            </View>
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
                <Pressable
                  onPress={goHub}
                  accessibilityRole="button"
                  accessibilityLabel="Ver meus relatos"
                  style={({ pressed }) => [
                    { minHeight: 48, minWidth: '100%', borderRadius: 16, borderWidth: 2, borderColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
                    pressed && { transform: [{ scale: 0.98 }] },
                  ]}
                >
                  <AppText font="display" weight={600} size={16} color="#FFFFFF">
                    Ver meus relatos
                  </AppText>
                </Pressable>
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
        </>
      )}
    </Screen>
  );
}

import React, { useState } from 'react';
import { Modal, Pressable, StatusBar as RNStatusBar, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { useMonitoring } from '@/contexts/MonitoringContext';
import { useHomeSensor } from '@/hooks/useHomeSensor';
import { useTheme } from '@/contexts/SettingsContext';
import { kindIcon } from '@/data/reportKinds';
import { formatDateTime, formatTime } from '@/utils/format';
import { hasReportPhoto, reportNumber } from '@/utils/reports';
import { cardShadow, levelStyle, stage } from '@/styles/theme';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { IconBadge, ScreenTitle, StatusChip } from '@/components/Controls';
import { Icon, type IconName } from '@/components/Icon';
import { ReportPhoto } from '@/components/ReportPhoto';
import { Screen } from '@/components/Screen';
import type { Report } from '@/types';

const fmtN = (n: number) => String(n).replace('.', ',');

/** "13:42" se for hoje; senão "13/11/2026 13:42". */
function when(iso: string): string {
  const d = new Date(iso);
  return new Date().toDateString() === d.toDateString() ? formatTime(d) : formatDateTime(d);
}

/** Selo branco sobre a foto (ex.: "Foto do cidadão", "Ampliar"). */
function PhotoTag({ icon, label, light }: { icon: IconName; label: string; light?: boolean }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingVertical: light ? 6 : 4,
        paddingLeft: light ? 8 : 6,
        paddingRight: light ? 12 : 10,
        borderRadius: 20,
        backgroundColor: light ? 'rgba(255,255,255,0.94)' : 'rgba(4,29,58,0.78)',
      }}
    >
      <Icon name={icon} size={20} color={light ? stage.deep : '#FFFFFF'} />
      <AppText size={14} weight={700} color={light ? stage.deep : '#FFFFFF'} lh={1.2} allowFontScaling={false}>
        {label}
      </AppText>
    </View>
  );
}

/** Uma linha da ficha do relato: ícone, rótulo pequeno e valor. */
function InfoRow({ icon, label, value, last }: { icon: IconName; label: string; value: string; last?: boolean }) {
  const { palette } = useTheme();
  return (
    <View
      accessible
      accessibilityLabel={`${label}: ${value}`}
      style={{ minHeight: 60, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: last ? 0 : 1, borderBottomColor: palette.line }}
    >
      <View style={{ width: 38, height: 38, borderRadius: 13, backgroundColor: palette.accentBg, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} size={22} color={palette.accent} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <AppText size={14} muted>
          {label}
        </AppText>
        <AppText weight={700}>{value}</AppText>
      </View>
    </View>
  );
}

/** Foto em tela cheia, sobre fundo escuro, com tipo, local e hora e o botão de fechar. */
function PhotoViewer({ report, visible, onClose }: { report: Report; visible: boolean; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} animationType="fade" transparent statusBarTranslucent onRequestClose={onClose}>
      <RNStatusBar barStyle="light-content" />
      <View
        accessibilityViewIsModal
        style={{ flex: 1, backgroundColor: 'rgba(2,12,24,0.96)', paddingTop: insets.top + 8, paddingBottom: insets.bottom + 12 }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingLeft: 20, paddingRight: 12 }}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <AppText font="display" weight={700} size={17} color="#FFFFFF">
              {report.tipo ?? 'Relato'}
            </AppText>
            <AppText size={14} color={stage.muted}>{`CEP ${report.cep} · ${when(report.observadoEm)}`}</AppText>
          </View>
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Fechar a foto"
            hitSlop={6}
            style={({ pressed }) => [
              { width: 48, height: 48, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
              pressed && { opacity: 0.7 },
            ]}
          >
            <Icon name="close" size={26} color="#FFFFFF" />
          </Pressable>
        </View>
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <View style={{ width: '100%', aspectRatio: 16 / 10 }}>
            <ReportPhoto report={report} fit="contain" id="viewer" />
          </View>
        </View>
        <AppText size={14} color={stage.muted} align="center" style={{ paddingHorizontal: 20 }}>
          {report.fotoUri ? 'Foto enviada com o relato' : 'Foto enviada com o relato · imagem de demonstração'}
        </AppText>
      </View>
    </Modal>
  );
}

/**
 * Detalhe de um relato (visão do agente): foto em destaque (toque para ver em tela cheia),
 * situação, ficha, o que o cidadão contou, o nível atual do sensor para comparar e os botões de revisão.
 */
export default function RelatoDetalheScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { palette, fontScale } = useTheme();
  const { reports, reviewReport, selectSensor } = useMonitoring();
  const { id: homeId, nome: homeName, current, level } = useHomeSensor();
  const [viewer, setViewer] = useState(false);

  const report = reports.find((r) => r.id === id);
  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/relatos'));

  if (!report) {
    return (
      <Screen back backLabel="Voltar para Relatos">
        <ScreenTitle>Relato não encontrado</ScreenTitle>
        <AppText muted style={{ marginHorizontal: 4 }}>
          Ele pode ter sido apagado deste aparelho.
        </AppText>
        <Button label="Voltar para Relatos" variant="outline" onPress={goBack} />
      </Screen>
    );
  }

  const comFoto = hasReportPhoto(report);
  const risk = levelStyle[level];
  const pending = report.status === 'pendente';
  const sensorHref = user?.role === 'agente' ? '/leituras' : '/sensor';

  return (
    <Screen back backLabel="Voltar para Relatos">
      <View style={{ gap: 2, paddingHorizontal: 4 }}>
        <ScreenTitle>{report.tipo ?? 'Relato'}</ScreenTitle>
        <AppText muted style={{ marginHorizontal: 4 }}>{`Relato #${reportNumber(report.id)} · enviado às ${formatTime(report.criadoEm)}`}</AppText>
      </View>

      {comFoto ? (
        <Pressable
          onPress={() => setViewer(true)}
          accessibilityRole="imagebutton"
          accessibilityLabel="Foto do relato. Toque para ampliar."
          style={({ pressed }) => [
            { width: '100%', aspectRatio: 16 / 10, borderRadius: 24, overflow: 'hidden', backgroundColor: '#2F4A5B' },
            cardShadow(palette, 0.18),
            pressed && { opacity: 0.9 },
          ]}
        >
          <ReportPhoto report={report} id="detail" />
          <View pointerEvents="none" style={{ position: 'absolute', left: 10, top: 10 }}>
            <PhotoTag icon="photo_camera" label="Foto do cidadão" />
          </View>
          <View pointerEvents="none" style={{ position: 'absolute', right: 10, bottom: 10 }}>
            <PhotoTag icon="open_in_full" label="Ampliar" light />
          </View>
        </Pressable>
      ) : (
        <View
          style={{
            width: '100%',
            aspectRatio: 16 / 10,
            padding: 16,
            borderRadius: 24,
            borderWidth: 2,
            borderStyle: 'dashed',
            borderColor: palette.border,
            backgroundColor: palette.surface,
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          <View style={{ width: 52, height: 52, borderRadius: 18, backgroundColor: palette.accentBg, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="hide_image" size={28} color={palette.accent} />
          </View>
          <AppText font="display" weight={700} align="center">
            Sem foto neste relato
          </AppText>
          <AppText size={14} muted align="center">
            Quando o cidadão anexar uma foto, ela aparece aqui.
          </AppText>
        </View>
      )}

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        <StatusChip status={report.status} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 3, paddingLeft: 6, paddingRight: 10, borderRadius: 20, backgroundColor: palette.accentBg }}>
          <Icon name={kindIcon(report.tipo)} size={20 * fontScale} color={palette.navy} />
          <AppText size={14} weight={700} color={palette.navy} lh={1.2}>
            {report.tipo ?? 'Relato'}
          </AppText>
        </View>
      </View>

      <View style={[{ backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.line, borderRadius: 22, paddingHorizontal: 14, paddingVertical: 4 }, cardShadow(palette, 0.06)]}>
        <InfoRow icon="location_on" label="Local" value={`CEP ${report.cep}`} />
        <InfoRow icon="schedule" label="Quando viu" value={when(report.observadoEm)} />
        <InfoRow icon="straighten" label="Altura da água (estimativa do cidadão)" value={`${report.alturaCm} cm`} />
        <InfoRow icon="person" label="Enviado por" value={report.autorId && report.autorId === user?.id ? 'Você' : 'Cidadão · identidade protegida'} last />
      </View>

      <View style={[{ backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.line, borderRadius: 22, paddingVertical: 14, paddingHorizontal: 16, gap: 6 }, cardShadow(palette, 0.06)]}>
        <AppText font="display" weight={700} color={palette.navy} accessibilityRole="header">
          O que o cidadão contou
        </AppText>
        <AppText>{report.descricao || 'Sem descrição.'}</AppText>
      </View>

      <LinearGradient
        colors={[stage.deep, stage.low]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 22 }}
      >
        <IconBadge icon={risk.icon} colors={risk.grad} size={42} iconSize={24} radius={14} filled />
        <View style={{ flex: 1 }} accessible accessibilityLabel={`Agora no ${homeName}: ${fmtN(current.nivelCm)} centímetros, ${risk.label}`}>
          <AppText size={14} color={stage.muted}>
            {`Agora no ${homeName}`}
          </AppText>
          <AppText font="display" weight={700} color="#FFFFFF">{`${fmtN(current.nivelCm)} cm · ${risk.label}`}</AppText>
        </View>
        <Pressable
          onPress={() => {
            selectSensor(homeId);
            router.push(sensorHref);
          }}
          accessibilityRole="button"
          accessibilityLabel={`Abrir o ${homeName}`}
          style={({ pressed }) => [
            { width: 48, height: 48, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
            pressed && { opacity: 0.7 },
          ]}
        >
          <Icon name="sensors" size={24} color="#FFFFFF" />
        </Pressable>
      </LinearGradient>

      {pending ? (
        <>
          <AppText size={14} muted style={{ marginHorizontal: 4 }}>
            Compare a foto e a descrição com o sensor antes de decidir.
          </AppText>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Button
              label="Descartar"
              icon="close"
              variant="outline"
              height={54}
              textColor={palette.ink}
              style={{ flex: 1, borderColor: palette.border }}
              onPress={() => reviewReport(report.id, 'descartado')}
            />
            <Button label="Validar" icon="check" variant="teal" height={54} display={false} style={{ flex: 1 }} onPress={() => reviewReport(report.id, 'validado')} />
          </View>
        </>
      ) : (
        <>
          <View accessibilityRole="alert" accessibilityLiveRegion="polite" style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 18, backgroundColor: palette.accentBg }}>
            <StatusChip status={report.status} />
            <AppText weight={700} color={palette.navy} style={{ flex: 1 }}>
              Relato revisado
            </AppText>
          </View>
          <Button label="Voltar para Relatos" variant="outline" onPress={goBack} />
        </>
      )}

      {comFoto ? <PhotoViewer report={report} visible={viewer} onClose={() => setViewer(false)} /> : null}
    </Screen>
  );
}

import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useMonitoring } from '@/contexts/MonitoringContext';
import { useTheme } from '@/contexts/SettingsContext';
import { kindIcon } from '@/data/reportKinds';
import { formatDateTime, formatTime } from '@/utils/format';
import { hasReportPhoto } from '@/utils/reports';
import { cardShadow, gradients, reportStatusStyle } from '@/styles/theme';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { IconBadge, ScreenTitle, Segmented, StatusChip } from '@/components/Controls';
import { Icon } from '@/components/Icon';
import { Screen } from '@/components/Screen';

type Filter = 'pend' | 'all';

export default function RelatosScreen() {
  const { palette, fontScale } = useTheme();
  const router = useRouter();
  const { reports, reviewReport } = useMonitoring();
  const [filter, setFilter] = useState<Filter>('pend');
  const pend = reports.filter((r) => r.status === 'pendente');
  // Pendentes primeiro, depois os já conferidos; dentro de cada grupo, os mais novos antes.
  const sorted = [...reports].sort((a, b) => {
    const pa = a.status === 'pendente' ? 0 : 1;
    const pb = b.status === 'pendente' ? 0 : 1;
    return pa - pb || b.criadoEm.localeCompare(a.criadoEm);
  });
  const list = filter === 'pend' ? sorted.filter((r) => r.status === 'pendente') : sorted;

  return (
    <Screen>
      <ScreenTitle>Relatos</ScreenTitle>
      <Segmented<Filter>
        label="Filtro"
        value={filter}
        onChange={setFilter}
        options={[
          { value: 'pend', label: `Aguardando (${pend.length})` },
          { value: 'all', label: 'Todos' },
        ]}
      />

      {list.length === 0 ? (
        <View style={{ padding: 24, borderRadius: 22, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.line, alignItems: 'center', gap: 8 }}>
          <Icon name="done_all" size={40} color="#19A57F" />
          <AppText muted>{filter === 'pend' ? 'Tudo revisado.' : 'Nenhum relato por enquanto.'}</AppText>
        </View>
      ) : null}

      {list.map((r) => {
        const when = new Date(r.observadoEm);
        const sameDay = new Date().toDateString() === when.toDateString();
        const hora = sameDay ? formatTime(when) : formatDateTime(when);
        const comFoto = hasReportPhoto(r);
        return (
          <View
            key={r.id}
            style={[{ backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.line, borderRadius: 22, padding: 14, gap: 10 }, cardShadow(palette, 0.06)]}
          >
            <Pressable
              onPress={() => router.push({ pathname: '/relato/[id]', params: { id: r.id } })}
              accessibilityRole="button"
              accessibilityLabel={`${r.tipo ?? 'Relato'}, CEP ${r.cep}, ${hora}. ${reportStatusStyle[r.status].label}${comFoto ? ', com foto' : ''}.`}
              accessibilityHint="Abre os detalhes e a foto do relato"
              style={({ pressed }) => [{ gap: 10 }, pressed && { opacity: 0.8 }]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <IconBadge icon={kindIcon(r.tipo)} colors={gradients.sensor} size={48} iconSize={26} radius={16} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <AppText font="display" weight={700}>
                    {r.tipo ?? 'Relato'}
                  </AppText>
                  <AppText size={14} muted>{`CEP ${r.cep} · ${hora}`}</AppText>
                </View>
                <Icon name="chevron_right" size={24 * fontScale} color={palette.inkMuted} />
              </View>
              <AppText numberOfLines={2}>{`${r.descricao || 'Sem descrição.'} Altura informada: ${r.alturaCm} cm.`}</AppText>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                <StatusChip status={r.status} />
                {comFoto ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 3, paddingLeft: 6, paddingRight: 10, borderRadius: 20, backgroundColor: palette.accentBg }}>
                    <Icon name="photo_camera" size={20 * fontScale} color={palette.navy} />
                    <AppText size={14} weight={700} color={palette.navy} lh={1.2}>
                      Com foto
                    </AppText>
                  </View>
                ) : null}
              </View>
            </Pressable>
            {r.status === 'pendente' ? (
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Button
                  label="Descartar"
                  icon="close"
                  variant="outline"
                  height={50}
                  textColor={palette.ink}
                  style={{ flex: 1, borderColor: palette.border }}
                  onPress={() => reviewReport(r.id, 'descartado')}
                />
                <Button label="Validar" icon="check" variant="teal" height={50} display={false} style={{ flex: 1 }} onPress={() => reviewReport(r.id, 'validado')} />
              </View>
            ) : null}
          </View>
        );
      })}
    </Screen>
  );
}

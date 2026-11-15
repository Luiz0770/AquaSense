import React, { useState } from 'react';
import { View } from 'react-native';
import { useMonitoring } from '@/contexts/MonitoringContext';
import { useTheme } from '@/contexts/SettingsContext';
import { kindIcon } from '@/data/reportKinds';
import { formatDateTime, formatTime } from '@/utils/format';
import { cardShadow, gradients } from '@/styles/theme';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { IconBadge, ScreenTitle, Segmented, StatusChip } from '@/components/Controls';
import { Icon } from '@/components/Icon';
import { Screen } from '@/components/Screen';

type Filter = 'pend' | 'all';

export default function RelatosScreen() {
  const { palette } = useTheme();
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
        return (
          <View
            key={r.id}
            style={[{ backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.line, borderRadius: 22, padding: 14, gap: 10 }, cardShadow(palette, 0.06)]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <IconBadge icon={kindIcon(r.tipo)} colors={gradients.sensor} size={48} iconSize={26} radius={16} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <AppText font="display" weight={700}>
                  {r.tipo ?? 'Relato'}
                </AppText>
                <AppText size={14} muted>{`CEP ${r.cep} · ${sameDay ? formatTime(when) : formatDateTime(when)}`}</AppText>
              </View>
            </View>
            <AppText>{`${r.descricao || 'Sem descrição.'} Altura informada: ${r.alturaCm} cm.`}</AppText>
            {r.comFoto ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Icon name="image" size={20} color={palette.accent} />
                <AppText size={14} muted>
                  Com foto (demonstração)
                </AppText>
              </View>
            ) : null}
            <StatusChip status={r.status} />
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

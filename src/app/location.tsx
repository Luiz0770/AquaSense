import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Pressable, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAppLocation, type SelectedLocation } from '@/contexts/LocationContext';
import { useTheme } from '@/contexts/SettingsContext';
import { BAIRROS, MONITORED_POINTS, type LocationOption } from '@/data/locations';
import { geocodeAddress } from '@/services/weather';
import { getCurrentLocationFix } from '@/services/geolocation';
import { normalizeText } from '@/utils/format';
import { haversineKm } from '@/utils/geo';
import { cardShadow } from '@/styles/theme';
import { AppText, ErrorText } from '@/components/AppText';
import { ScreenTitle, SectionTitle } from '@/components/Controls';
import { Icon, type IconName } from '@/components/Icon';
import { useLoop } from '@/components/motion';
import { Screen } from '@/components/Screen';
import { Gradient } from '@/components/Surfaces';
import { TextField } from '@/components/TextField';

const fmtKm = (km: number) => `a ${String(Math.round(km * 10) / 10).replace('.', ',')} km`;

/** Item de local (ponto monitorado ou bairro): card branco, chip de ícone e estado selecionado em gradiente azul. */
function LocationRow({
  icon,
  name,
  subtitle,
  selected,
  onPress,
}: {
  icon: IconName;
  name: string;
  subtitle: string;
  selected: boolean;
  onPress: () => void;
}) {
  const { palette, fontScale } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={`${name}, ${subtitle}${selected ? ', selecionado' : ''}`}
      style={({ pressed }) => [
        {
          minHeight: 68,
          paddingVertical: 10,
          paddingHorizontal: 12,
          borderRadius: 20,
          borderWidth: 2,
          borderColor: selected ? palette.selectedBorder : palette.line,
          backgroundColor: palette.surface,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
        },
        cardShadow(palette, 0.05),
        pressed && { transform: [{ scale: 0.99 }] },
      ]}
    >
      {selected ? (
        <Gradient colors={palette.selected} style={{ width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={icon} filled size={24} color="#FFFFFF" />
        </Gradient>
      ) : (
        <View style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: palette.accentBg, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={icon} size={24} color={palette.accent} />
        </View>
      )}
      <View style={{ flex: 1, minWidth: 0 }}>
        <AppText weight={700} numberOfLines={1}>
          {name}
        </AppText>
        <AppText size={14} muted numberOfLines={1}>
          {subtitle}
        </AppText>
      </View>
      <Icon name={selected ? 'check_circle' : 'chevron_right'} filled={selected} size={24 * fontScale} color={selected ? palette.accent : palette.inkMuted} />
    </Pressable>
  );
}

type GpsState = 'idle' | 'loading' | 'error';

export default function LocationScreen() {
  const router = useRouter();
  const { palette, fontScale } = useTheme();
  const { selected, lastFix, selectLocation, selectFromGps } = useAppLocation();
  const [query, setQuery] = useState('');
  const [gpsState, setGpsState] = useState<GpsState>('idle');
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [customError, setCustomError] = useState<string | null>(null);
  const [resolvingCustom, setResolvingCustom] = useState(false);
  const alive = useRef(true);

  const spin = useLoop(900, { easing: Easing.linear });
  const spinDeg = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  const normalizedQuery = normalizeText(query);

  const withDistance = useCallback(
    (list: LocationOption[]) => {
      const withKm = list.map((item) => ({ item, km: lastFix ? haversineKm(lastFix.lat, lastFix.lon, item.lat, item.lon) : null }));
      if (lastFix) withKm.sort((a, b) => (a.km ?? 0) - (b.km ?? 0));
      return withKm;
    },
    [lastFix],
  );

  const filteredPoints = useMemo(() => {
    const base = withDistance(MONITORED_POINTS);
    if (!normalizedQuery) return base;
    return base.filter((x) => normalizeText(x.item.name).includes(normalizedQuery));
  }, [normalizedQuery, withDistance]);

  const filteredBairros = useMemo(() => {
    const base = withDistance(BAIRROS);
    if (!normalizedQuery) return base;
    return base.filter((x) => normalizeText(x.item.name).includes(normalizedQuery));
  }, [normalizedQuery, withDistance]);

  const exactMatch =
    normalizedQuery.length > 0 &&
    (MONITORED_POINTS.some((p) => normalizeText(p.name) === normalizedQuery) || BAIRROS.some((b) => normalizeText(b.name) === normalizedQuery));

  const showCustomOption = query.trim().length >= 3 && !exactMatch;
  const nothingFound = normalizedQuery.length > 0 && filteredPoints.length === 0 && filteredBairros.length === 0;

  const goBackHome = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  const pick = (loc: SelectedLocation) => {
    selectLocation(loc);
    goBackHome();
  };

  const pickOption = (opt: LocationOption, subtitle: string, km: number | null) => {
    pick({ id: opt.id, name: opt.name, subtitle: km !== null ? `${subtitle} · ${fmtKm(km)}` : subtitle, lat: opt.lat, lon: opt.lon });
  };

  const handleGps = async () => {
    setGpsState('loading');
    setGpsError(null);
    try {
      const fix = await getCurrentLocationFix();
      if (!alive.current) return;
      selectFromGps(fix);
      goBackHome();
    } catch {
      if (!alive.current) return;
      setGpsState('error');
      setGpsError('Não foi possível obter sua localização agora. Verifique a permissão do app e tente novamente.');
    } finally {
      if (alive.current) setGpsState((s) => (s === 'loading' ? 'idle' : s));
    }
  };

  const handleCustom = async () => {
    const text = query.trim();
    setCustomError(null);
    setResolvingCustom(true);
    try {
      const result = await geocodeAddress(`${text}, São Paulo, Brasil`);
      if (!alive.current) return;
      if (!result) {
        setCustomError('Não encontramos esse endereço. Verifique o que foi digitado.');
        return;
      }
      pick({ id: 'custom', name: text, subtitle: 'Endereço digitado por você', lat: result.lat, lon: result.lon });
    } catch {
      if (alive.current) setCustomError('Não encontramos esse endereço. Verifique o que foi digitado.');
    } finally {
      if (alive.current) setResolvingCustom(false);
    }
  };

  React.useEffect(
    () => () => {
      alive.current = false;
    },
    [],
  );

  return (
    <Screen back backLabel="Voltar para o início">
      <View style={{ gap: 2, paddingHorizontal: 4 }}>
        <ScreenTitle>Sua localização</ScreenTitle>
        <AppText muted style={{ marginHorizontal: 4 }}>
          Escolha de onde ver a previsão de chuva.
        </AppText>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 20, backgroundColor: palette.accentBg }}>
        <Icon name="location_on" filled size={28} color={palette.accent} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <AppText size={14} weight={700} color={palette.navy}>
            Local atual
          </AppText>
          <AppText font="display" size={17} color={palette.navy} numberOfLines={1}>
            {selected.name}
          </AppText>
        </View>
      </View>

      <Pressable
        onPress={handleGps}
        disabled={gpsState === 'loading'}
        accessibilityRole="button"
        accessibilityLabel={gpsState === 'loading' ? 'Localizando, aguarde' : 'Usar minha localização atual'}
        style={({ pressed }) => [{ borderRadius: 20, opacity: gpsState === 'loading' ? 0.85 : 1 }, pressed && { transform: [{ scale: 0.99 }] }]}
      >
        <LinearGradient colors={palette.button} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ minHeight: 72, borderRadius: 20, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' }}>
            {gpsState === 'loading' ? (
              <Animated.View style={{ transform: [{ rotate: spinDeg }] }}>
                <Icon name="restart_alt" size={24} color="#FFFFFF" />
              </Animated.View>
            ) : (
              <Icon name="my_location" size={24} color="#FFFFFF" />
            )}
          </View>
          <View style={{ flex: 1 }}>
            <AppText font="display" weight={600} size={16} color="#FFFFFF">
              {gpsState === 'loading' ? 'Localizando…' : 'Usar minha localização atual'}
            </AppText>
            <AppText size={14} color="rgba(255,255,255,0.85)">
              Localização aproximada · não é salva
            </AppText>
          </View>
        </LinearGradient>
      </Pressable>
      {gpsError ? <ErrorText>{gpsError}</ErrorText> : null}

      <TextField label="Ou digite o bairro ou a rua" icon="search" placeholder="Ex.: Rua Silva Bueno" value={query} onChangeText={setQuery} />

      {showCustomOption ? (
        <Pressable
          onPress={handleCustom}
          disabled={resolvingCustom}
          accessibilityRole="button"
          accessibilityLabel={`Usar "${query.trim()}", endereço digitado por você`}
          style={({ pressed }) => [
            {
              minHeight: 68,
              paddingVertical: 10,
              paddingHorizontal: 14,
              borderRadius: 20,
              borderWidth: 2,
              borderStyle: 'dashed',
              borderColor: palette.border,
              backgroundColor: palette.surface,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              opacity: resolvingCustom ? 0.7 : 1,
            },
            pressed && { transform: [{ scale: 0.99 }] },
          ]}
        >
          <Icon name="location_on" size={28 * fontScale} color={palette.accent} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <AppText weight={700} numberOfLines={1}>{`Usar "${query.trim()}"`}</AppText>
            <AppText size={14} muted>
              {resolvingCustom ? 'Procurando…' : 'Endereço digitado por você'}
            </AppText>
          </View>
        </Pressable>
      ) : null}
      {customError ? <ErrorText>{customError}</ErrorText> : null}

      {nothingFound ? (
        <AppText size={14} muted style={{ marginHorizontal: 4 }}>
          Nenhum bairro encontrado na lista. Você pode usar o texto digitado.
        </AppText>
      ) : null}

      {filteredPoints.length > 0 ? (
        <View accessibilityRole="radiogroup" accessibilityLabel="Pontos monitorados" style={{ gap: 10 }}>
          <SectionTitle>Pontos monitorados</SectionTitle>
          {filteredPoints.map(({ item, km }) => (
            <LocationRow
              key={item.id}
              icon="sensors"
              name={item.name}
              subtitle={km !== null ? `${item.subtitle} · ${fmtKm(km)}` : item.subtitle}
              selected={selected.id === item.id}
              onPress={() => pickOption(item, item.subtitle, km)}
            />
          ))}
        </View>
      ) : null}

      {filteredBairros.length > 0 ? (
        <View accessibilityRole="radiogroup" accessibilityLabel="Bairros" style={{ gap: 10 }}>
          <SectionTitle>Bairros</SectionTitle>
          {filteredBairros.map(({ item, km }) => (
            <LocationRow
              key={item.id}
              icon="pin_drop"
              name={item.name}
              subtitle={km !== null ? `${item.subtitle} · ${fmtKm(km)}` : item.subtitle}
              selected={selected.id === item.id}
              onPress={() => pickOption(item, item.subtitle, km)}
            />
          ))}
        </View>
      ) : null}

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 20, borderWidth: 1, borderColor: palette.line, backgroundColor: palette.surface }}>
        <Icon name="shield" size={26 * fontScale} color={palette.accent} />
        <AppText size={14} muted style={{ flex: 1 }}>
          Usamos só a localização aproximada, sem salvar. O nível da água continua vindo do sensor PT-07.
        </AppText>
      </View>
    </Screen>
  );
}

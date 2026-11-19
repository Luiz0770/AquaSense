import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { DEFAULT_LOCATION } from '@/data/locations';
import { getCurrentLocationFix } from '@/services/geolocation';
import {
  loadLastGpsFix,
  loadLocationAsked,
  loadSelectedLocation,
  saveLastGpsFix,
  saveLocationAsked,
  saveSelectedLocation,
} from '@/services/locationService';
import type { GpsFix, SelectedLocation } from '@/types';
import { isPermissionDenied, shouldRequestLocationOnLogin } from '@/utils/locationOnboarding';
import { useAuth } from './AuthContext';

export type { GpsFix, SelectedLocation };

interface LocationValue {
  ready: boolean;
  /** Local escolhido para alimentar a previsão. O nível da água da tela Início é do Sensor 1 (veja useHomeSensor). */
  selected: SelectedLocation;
  /** Última posição obtida por GPS. */
  lastFix: GpsFix | null;
  selectLocation: (loc: SelectedLocation) => void;
  selectFromGps: (fix: GpsFix) => void;
}

const LocationContext = createContext<LocationValue | null>(null);

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [ready, setReady] = useState(false);
  const [selected, setSelected] = useState<SelectedLocation>(DEFAULT_LOCATION);
  const [lastFix, setLastFix] = useState<GpsFix | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const [savedLoc, savedFix] = await Promise.all([
        loadSelectedLocation(),
        loadLastGpsFix(),
      ]);
      if (!alive) return;
      // O local padrão antigo ("PT-07 · Ipiranga") virou o Sensor 1.
      if (savedLoc) setSelected(savedLoc.id === 'pt-07' ? DEFAULT_LOCATION : savedLoc);
      if (savedFix) setLastFix(savedFix);
      setReady(true);
    })();
    return () => {
      alive = false;
    };
  }, []);

  const selectLocation = useCallback((loc: SelectedLocation) => {
    setSelected(loc);
    void saveSelectedLocation(loc);
  }, []);

  const selectFromGps = useCallback((fix: GpsFix) => {
    const loc: SelectedLocation = {
      id: 'gps',
      name: 'Minha localização atual',
      subtitle: 'Localização aproximada',
      lat: fix.lat,
      lon: fix.lon,
    };
    setSelected(loc);
    setLastFix(fix);
    void saveSelectedLocation(loc);
    void saveLastGpsFix(fix);
  }, []);

  // Primeiro login depois da instalação: pede a localização atual e a usa como local padrão.
  // Negou a permissão: segue no Sensor 1 e não pergunta de novo (o botão da tela "Sua localização" continua valendo).
  // Falha por outro motivo (ex.: GPS desligado): tenta de novo no próximo login.
  const userId = user?.id;
  const askedThisSession = useRef(false);
  useEffect(() => {
    if (!ready || !userId || askedThisSession.current) return;
    askedThisSession.current = true;
    (async () => {
      const [asked, saved] = await Promise.all([loadLocationAsked(), loadSelectedLocation()]);
      if (!shouldRequestLocationOnLogin(asked, saved !== null)) {
        if (!asked) void saveLocationAsked();
        return;
      }
      try {
        const fix = await getCurrentLocationFix();
        void saveLocationAsked();
        selectFromGps(fix);
      } catch (e) {
        if (isPermissionDenied(e)) void saveLocationAsked();
      }
    })();
  }, [ready, userId, selectFromGps]);

  const value = useMemo<LocationValue>(
    () => ({ ready, selected, lastFix, selectLocation, selectFromGps }),
    [ready, selected, lastFix, selectLocation, selectFromGps],
  );

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
}

export function useAppLocation(): LocationValue {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error('useAppLocation precisa estar dentro de LocationProvider');
  return ctx;
}

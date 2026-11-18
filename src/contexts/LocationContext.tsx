import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { MONITORED_POINTS } from '@/data/locations';
import { loadLastGpsFix, loadSelectedLocation, saveLastGpsFix, saveSelectedLocation } from '@/services/locationService';
import type { GpsFix, SelectedLocation } from '@/types';

export type { GpsFix, SelectedLocation };

interface LocationValue {
  ready: boolean;
  /** Local escolhido para alimentar a previsão (nunca o nível da água, que é sempre do sensor PT-07). */
  selected: SelectedLocation;
  /** Última posição obtida por GPS, lembrada para ordenar os pontos e bairros por proximidade. */
  lastFix: GpsFix | null;
  selectLocation: (loc: SelectedLocation) => void;
  selectFromGps: (fix: GpsFix) => void;
}

const [defaultPoint] = MONITORED_POINTS;
const DEFAULT_LOCATION: SelectedLocation = {
  id: defaultPoint.id,
  name: defaultPoint.name,
  subtitle: defaultPoint.subtitle,
  lat: defaultPoint.lat,
  lon: defaultPoint.lon,
};

const LocationContext = createContext<LocationValue | null>(null);

export function LocationProvider({ children }: { children: React.ReactNode }) {
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
      if (savedLoc) setSelected(savedLoc);
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

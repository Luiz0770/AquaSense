import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AccessibilityInfo } from 'react-native';
import type { FontSize, Settings } from '@/types';
import { defaultSettings, loadSettings, saveSettings } from '@/services/settingsService';
import { fontScaleBySize, highContrast, light, type Palette } from '@/styles/theme';
import { getItem, StorageKeys } from '@/services/storage';

interface SettingsValue {
  settings: Settings;
  loaded: boolean;
  palette: Palette;
  fontScale: number;
  reduceMotion: boolean;
  setFontSize: (size: FontSize) => void;
  setHighContrast: (on: boolean) => void;
  setReduceMotion: (on: boolean) => void;
  dismissNotice: () => void;
}

const SettingsContext = createContext<SettingsValue | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      const saved = await getItem<Partial<Settings> | null>(StorageKeys.settings, null);
      const base = await loadSettings();
      // Sem configuração salva, respeita a preferência do sistema por menos movimento.
      if (saved === null) {
        try {
          base.reduceMotion = await AccessibilityInfo.isReduceMotionEnabled();
        } catch {
          // mantém o padrão
        }
      }
      if (alive) {
        setSettings(base);
        setLoaded(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const update = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      void saveSettings(next);
      return next;
    });
  }, []);

  const value = useMemo<SettingsValue>(
    () => ({
      settings,
      loaded,
      palette: settings.highContrast ? highContrast : light,
      fontScale: fontScaleBySize[settings.fontSize],
      reduceMotion: settings.reduceMotion,
      setFontSize: (fontSize) => update({ fontSize }),
      setHighContrast: (on) => update({ highContrast: on }),
      setReduceMotion: (on) => update({ reduceMotion: on }),
      dismissNotice: () => update({ noticeDismissed: true }),
    }),
    [settings, loaded, update],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useTheme(): SettingsValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useTheme precisa estar dentro de SettingsProvider');
  return ctx;
}

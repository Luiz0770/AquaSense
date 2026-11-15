import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { AlertEvent, Level, Reading, Report, ReportStatus, Scenario } from '@/types';
import { initialReading, nextReading, READING_INTERVAL_MS } from '@/services/iot/simulator';
import { levelFor } from '@/services/iot/thresholds';
import {
  loadReadings,
  loadRunning,
  loadScenario,
  MAX_READINGS,
  saveReadings,
  saveRunning,
  saveScenario,
} from '@/services/readingService';
import { buildAlert, loadAlerts, MAX_ALERTS, saveAlerts } from '@/services/alertService';
import { createReport, loadReports, saveReports, withStatus, type NewReportInput } from '@/services/reportService';
import { useAuth } from './AuthContext';

interface MonitoringValue {
  ready: boolean;
  current: Reading;
  /** Da mais nova para a mais antiga. */
  readings: Reading[];
  level: Level;
  scenario: Scenario;
  running: boolean;
  alerts: AlertEvent[];
  /** Aviso de mudança de estado ainda não dispensado (só para Atenção, Alerta e Crítico). */
  banner: AlertEvent | null;
  reports: Report[];
  setScenario: (s: Scenario) => void;
  togglePause: () => void;
  /** Gera uma leitura agora, sem esperar os 5 s (botão "Nova leitura" da Simulação). */
  stepNow: () => void;
  restart: () => void;
  dismissBanner: () => void;
  addReport: (input: Omit<NewReportInput, 'autorId'>) => Report;
  reviewReport: (id: string, status: ReportStatus) => void;
}

const MonitoringContext = createContext<MonitoringValue | null>(null);

export function MonitoringProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [ready, setReady] = useState(false);
  const [readings, setReadings] = useState<Reading[]>(() => [initialReading()]);
  const [scenario, setScenarioState] = useState<Scenario>('moderada');
  const [running, setRunning] = useState(true);
  const [alerts, setAlerts] = useState<AlertEvent[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [dismissedId, setDismissedId] = useState<string | null>(null);

  // A simulação lê sempre o estado mais novo por esta ref, sem recriar o intervalo a cada leitura.
  const live = useRef({ readings, scenario, alerts });
  live.current = { readings, scenario, alerts };

  useEffect(() => {
    let alive = true;
    (async () => {
      const [r, s, run, a, rep] = await Promise.all([
        loadReadings(),
        loadScenario(),
        loadRunning(),
        loadAlerts(),
        loadReports(),
      ]);
      if (!alive) return;
      setReadings(r);
      setScenarioState(s);
      setRunning(run);
      setAlerts(a);
      setReports(rep);
      setReady(true);
    })();
    return () => {
      alive = false;
    };
  }, []);

  const tick = useCallback(() => {
    const { readings: list, scenario: sc, alerts: al } = live.current;
    const prev = list[0];
    const next = nextReading(prev, sc);
    const nextList = [next, ...list].slice(0, MAX_READINGS);
    setReadings(nextList);
    void saveReadings(nextList);

    const before = levelFor(prev.nivelCm);
    const after = levelFor(next.nivelCm);
    if (before !== after) {
      const event = buildAlert(before, after, next);
      const nextAlerts = [event, ...al].slice(0, MAX_ALERTS);
      setAlerts(nextAlerts);
      void saveAlerts(nextAlerts);
    }
  }, []);

  // A simulação só roda com alguém logado e enquanto não estiver pausada.
  useEffect(() => {
    if (!ready || !user || !running) return;
    const id = setInterval(tick, READING_INTERVAL_MS);
    return () => clearInterval(id);
  }, [ready, user, running, tick]);

  const current = readings[0];
  const level = levelFor(current.nivelCm);

  const banner = useMemo(() => {
    if (level === 'normal') return null;
    const last = alerts[0];
    if (!last || last.para !== level || last.id === dismissedId) return null;
    return last;
  }, [alerts, level, dismissedId]);

  const setScenario = useCallback((s: Scenario) => {
    setScenarioState(s);
    void saveScenario(s);
  }, []);

  const togglePause = useCallback(() => {
    setRunning((prev) => {
      void saveRunning(!prev);
      return !prev;
    });
  }, []);

  const restart = useCallback(() => {
    const fresh = [initialReading()];
    setReadings(fresh);
    setAlerts([]);
    setDismissedId(null);
    setRunning(true);
    void saveReadings(fresh);
    void saveAlerts([]);
    void saveRunning(true);
  }, []);

  const dismissBanner = useCallback(() => {
    if (live.current.alerts[0]) setDismissedId(live.current.alerts[0].id);
  }, []);

  const addReport = useCallback(
    (input: Omit<NewReportInput, 'autorId'>) => {
      const report = createReport({ ...input, autorId: user?.id });
      setReports((prev) => {
        const next = [report, ...prev];
        void saveReports(next);
        return next;
      });
      return report;
    },
    [user?.id],
  );

  const reviewReport = useCallback((id: string, status: ReportStatus) => {
    setReports((prev) => {
      const next = withStatus(prev, id, status);
      void saveReports(next);
      return next;
    });
  }, []);

  const value = useMemo<MonitoringValue>(
    () => ({
      ready,
      current,
      readings,
      level,
      scenario,
      running,
      alerts,
      banner,
      reports,
      setScenario,
      togglePause,
      stepNow: tick,
      restart,
      dismissBanner,
      addReport,
      reviewReport,
    }),
    [
      tick,
      ready,
      current,
      readings,
      level,
      scenario,
      running,
      alerts,
      banner,
      reports,
      setScenario,
      togglePause,
      restart,
      dismissBanner,
      addReport,
      reviewReport,
    ],
  );

  return <MonitoringContext.Provider value={value}>{children}</MonitoringContext.Provider>;
}

export function useMonitoring(): MonitoringValue {
  const ctx = useContext(MonitoringContext);
  if (!ctx) throw new Error('useMonitoring precisa estar dentro de MonitoringProvider');
  return ctx;
}

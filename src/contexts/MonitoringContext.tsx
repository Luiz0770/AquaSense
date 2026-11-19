import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { AlertEvent, DataSource, Level, Reading, Report, ReportStatus, Scenario } from '@/types';
import { DEFAULT_SENSOR_ID, SENSORS, sensorById as sensorDefById, type SensorDef } from '@/data/sensors';
import { nextReading, READING_INTERVAL_MS, regionalRain } from '@/services/iot/simulator';
import { levelFor } from '@/services/iot/thresholds';
import { connectLiveSource, LIVE_SOURCE } from '@/services/iot/liveSource';
import type { MqttStatus } from '@/services/iot/mqttLite';
import { freshSensorState, normalizeSensorStore, withReading, type SensorStore } from '@/services/iot/sensorStore';
import { makeId } from '@/utils/format';
import { fetchForecast } from '@/services/weather';
import { loadSensorStore, saveSensorStore } from '@/services/readingService';
import { buildAlert, loadAlerts, MAX_ALERTS, saveAlerts } from '@/services/alertService';
import { createReport, loadReports, saveReports, withStatus, type NewReportInput } from '@/services/reportService';
import { useAuth } from './AuthContext';

export interface Trend {
  icon: 'trending_up' | 'trending_down' | 'trending_flat';
  label: string;
}

/** Tendência comparando a leitura mais nova com a de umas 4 leituras atrás. */
export function trendOf(readings: Reading[]): Trend {
  const last = readings[0];
  const prev = readings[Math.min(4, readings.length - 1)];
  const d = last.nivelCm - prev.nivelCm;
  if (d > 1.5) return { icon: 'trending_up', label: 'Subindo' };
  if (d < -1.5) return { icon: 'trending_down', label: 'Descendo' };
  return { icon: 'trending_flat', label: 'Estável' };
}

/** Tudo o que as telas precisam saber de um sensor. */
export interface SensorView {
  def: SensorDef;
  id: string;
  nome: string;
  /** Da mais nova para a mais antiga. */
  readings: Reading[];
  current: Reading;
  level: Level;
  scenario: Scenario;
  /** Simulação ligada (quando o ESP32 manda leituras deste sensor, a simulação dele fica em espera). */
  running: boolean;
  /** 'esp32' enquanto o Wokwi estiver mandando leituras deste sensor; senão 'simulado'. */
  source: DataSource;
  trend: Trend;
}

interface MonitoringValue {
  ready: boolean;
  sensors: SensorView[];
  sensorById: (id: string) => SensorView;
  /** Sensor escolhido nas telas Sensor e Simular. */
  selectedSensorId: string;
  selectSensor: (id: string) => void;
  /** Quantos sensores estão recebendo leituras do ESP32 agora. */
  liveCount: number;
  /** Texto curto da fonte para os rótulos ("sensores ESP32" ou "simulado"). */
  sourceLabel: string;
  /** Conexão com o broker MQTT. */
  liveStatus: MqttStatus;
  /** Chuva de agora (mm/h) da Open-Meteo no local dos sensores; null enquanto não chegou. */
  apiRainMm: number | null;
  alerts: AlertEvent[];
  /** Aviso de mudança de estado ainda não dispensado (só para Atenção, Alerta e Crítico). */
  banner: AlertEvent | null;
  reports: Report[];
  setScenarioFor: (id: string, s: Scenario) => void;
  toggleRun: (id: string) => void;
  /** Gera uma leitura agora para o sensor, sem esperar os 5 s (botão "Leitura" da Simulação). */
  stepNow: (id: string) => void;
  restartSensor: (id: string) => void;
  setAllRunning: (running: boolean) => void;
  restartAll: () => void;
  applyScenarioToAll: (s: Scenario) => void;
  dismissBanner: () => void;
  addReport: (input: Omit<NewReportInput, 'autorId'>) => Report;
  reviewReport: (id: string, status: ReportStatus) => void;
}

const MonitoringContext = createContext<MonitoringValue | null>(null);

export function MonitoringProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [ready, setReady] = useState(false);
  const [store, setStore] = useState<SensorStore>(() => normalizeSensorStore(null));
  const [alerts, setAlerts] = useState<AlertEvent[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [dismissedId, setDismissedId] = useState<string | null>(null);
  const [selectedSensorId, setSelectedSensorId] = useState(DEFAULT_SENSOR_ID);
  const [liveStatus, setLiveStatus] = useState<MqttStatus>('desconectado');
  /** Sensores que mandaram leitura do ESP32 nos últimos 15 s. */
  const [liveIds, setLiveIds] = useState<Record<string, boolean>>({});
  const lastLiveAt = useRef<Record<string, number>>({});
  /** Última chuva vinda do ESP32 (a chuva é uma só para a região). */
  const lastLiveRain = useRef<number | null>(null);
  /** Chuva de agora da Open-Meteo (cenário "Clima real"). */
  const [apiRainMm, setApiRainMm] = useState<number | null>(null);
  const apiRain = useRef<number | null>(null);

  // A simulação lê sempre o estado mais novo por esta ref, sem recriar o intervalo a cada leitura.
  const live = useRef({ store, alerts });
  useEffect(() => {
    live.current = { store, alerts };
  });

  // Grava no aparelho no máximo uma vez por segundo (chegam até 3 leituras juntas).
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const persist = useCallback(() => {
    if (saveTimer.current) return;
    saveTimer.current = setTimeout(() => {
      saveTimer.current = null;
      void saveSensorStore(live.current.store);
    }, 1000);
  }, []);
  useEffect(
    () => () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    },
    [],
  );

  const commitStore = useCallback(
    (next: SensorStore) => {
      live.current = { ...live.current, store: next };
      setStore(next);
      persist();
    },
    [persist],
  );

  useEffect(() => {
    let alive = true;
    (async () => {
      const [s, a, rep] = await Promise.all([loadSensorStore(), loadAlerts(), loadReports()]);
      if (!alive) return;
      live.current = { store: s, alerts: a };
      setStore(s);
      setAlerts(a);
      setReports(rep);
      setReady(true);
    })();
    return () => {
      alive = false;
    };
  }, []);

  /** Entrada única de leituras (simulador ou ESP32): guarda, persiste e gera o alerta de mudança de faixa. */
  const pushReading = useCallback(
    (id: string, next: Reading) => {
      const { store: cur, alerts: al } = live.current;
      const prev = cur[id]?.readings[0];
      if (!prev) return;
      commitStore(withReading(cur, id, { ...next, sensorId: id }));

      const before = levelFor(prev.nivelCm);
      const after = levelFor(next.nivelCm);
      if (before !== after) {
        const event = buildAlert(before, after, { ...next, sensorId: id });
        const nextAlerts = [event, ...al].slice(0, MAX_ALERTS);
        live.current = { ...live.current, alerts: nextAlerts };
        setAlerts(nextAlerts);
        void saveAlerts(nextAlerts);
      }
    },
    [commitStore],
  );

  const isLive = (id: string, now = Date.now()) => now - (lastLiveAt.current[id] ?? 0) < LIVE_SOURCE.timeoutMs;

  /** Chuva para as leituras simuladas: a do ESP32, se algum sensor estiver ao vivo; senão a dos cenários. */
  const rainNow = (s: SensorStore) => {
    const anyLive = SENSORS.some((d) => isLive(d.id));
    if (anyLive && lastLiveRain.current !== null) return lastLiveRain.current;
    return regionalRain(SENSORS.map((d) => s[d.id].scenario), apiRain.current);
  };

  const simulate = useCallback(
    (ids: string[]) => {
      const s = live.current.store;
      if (!ids.length) return;
      const chuvaMm = rainNow(s);
      for (const id of ids) {
        const st = live.current.store[id];
        if (!st) continue;
        const def = sensorDefById(id);
        pushReading(id, nextReading(st.readings[0], st.scenario, new Date(), Math.random, { fator: def.fator, base: def.base, chuvaMm, apiRainMm: apiRain.current }));
      }
    },
    // rainNow/isLive só leem refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pushReading],
  );

  const tick = useCallback(() => {
    // Cada sensor simula sozinho só se estiver ligado e o ESP32 não estiver mandando leituras dele.
    const s = live.current.store;
    const now = Date.now();
    simulate(SENSORS.filter((d) => s[d.id]?.running && !isLive(d.id, now)).map((d) => d.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [simulate]);

  // Chuva real (Open-Meteo) no local dos sensores, atualizada a cada 15 min. Sem internet, vale 0.
  useEffect(() => {
    if (!ready || !user) return;
    let alive = true;
    const load = async () => {
      try {
        const f = await fetchForecast();
        const mm = Math.max(0, f.hours[0]?.mm ?? 0);
        if (!alive) return;
        apiRain.current = mm;
        setApiRainMm(mm);
      } catch {
        // Mantém o último valor conhecido.
      }
    };
    void load();
    const id = setInterval(load, 15 * 60 * 1000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [ready, user]);

  // A simulação só roda com alguém logado.
  useEffect(() => {
    if (!ready || !user) return;
    const id = setInterval(tick, READING_INTERVAL_MS);
    return () => clearInterval(id);
  }, [ready, user, tick]);

  // Fonte ao vivo: assina o tópico MQTT do ESP32 (Wokwi), que manda uma mensagem por sensor.
  const userId = user?.id;
  useEffect(() => {
    if (!ready || !userId) return;
    const stop = connectLiveSource({
      onStatus: setLiveStatus,
      onReading: (r) => {
        lastLiveAt.current[r.sensorId] = Date.now();
        lastLiveRain.current = r.chuvaMm;
        setLiveIds((prev) => (prev[r.sensorId] ? prev : { ...prev, [r.sensorId]: true }));
        pushReading(r.sensorId, { id: makeId('r'), ...r, timestamp: new Date().toISOString() });
      },
    });
    return () => {
      stop();
      lastLiveAt.current = {};
      lastLiveRain.current = null;
      setLiveIds({});
    };
  }, [ready, userId, pushReading]);

  // Se o ESP32 parar de mandar um sensor por 15 s (Wokwi fechado, sem internet), ele volta para o simulador.
  const anyLive = Object.values(liveIds).some(Boolean);
  useEffect(() => {
    if (!anyLive) return;
    const id = setInterval(() => {
      const now = Date.now();
      setLiveIds((prev) => {
        let changed = false;
        const next: Record<string, boolean> = {};
        for (const k of Object.keys(prev)) {
          const on = prev[k] && now - (lastLiveAt.current[k] ?? 0) < LIVE_SOURCE.timeoutMs;
          if (on) next[k] = true;
          if (on !== prev[k]) changed = true;
        }
        return changed ? next : prev;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [anyLive]);

  const sensors = useMemo<SensorView[]>(
    () =>
      SENSORS.map((def) => {
        const st = store[def.id];
        const current = st.readings[0];
        return {
          def,
          id: def.id,
          nome: def.nome,
          readings: st.readings,
          current,
          level: levelFor(current.nivelCm),
          scenario: st.scenario,
          running: st.running,
          source: liveIds[def.id] ? 'esp32' : 'simulado',
          trend: trendOf(st.readings),
        };
      }),
    [store, liveIds],
  );

  const sensorById = useCallback((id: string) => sensors.find((s) => s.id === id) ?? sensors[0], [sensors]);
  const liveCount = sensors.filter((s) => s.source === 'esp32').length;
  const sourceLabel = liveCount > 0 ? 'sensores ESP32' : 'simulado';

  const banner = useMemo(() => {
    const last = alerts[0];
    if (!last || last.para === 'normal' || last.id === dismissedId) return null;
    const s = sensors.find((x) => x.id === (last.sensorId ?? DEFAULT_SENSOR_ID));
    if (!s || s.level !== last.para) return null;
    return last;
  }, [alerts, sensors, dismissedId]);

  const updateSensor = useCallback(
    (id: string, fn: (st: SensorStore[string]) => Partial<SensorStore[string]>) => {
      const cur = live.current.store;
      if (!cur[id]) return;
      commitStore({ ...cur, [id]: { ...cur[id], ...fn(cur[id]) } });
    },
    [commitStore],
  );

  const setScenarioFor = useCallback((id: string, s: Scenario) => updateSensor(id, () => ({ scenario: s, running: true })), [updateSensor]);
  const toggleRun = useCallback((id: string) => updateSensor(id, (st) => ({ running: !st.running })), [updateSensor]);
  const stepNow = useCallback((id: string) => simulate([id]), [simulate]);

  const dropAlertsOf = useCallback((ids: string[] | null) => {
    const next = ids ? live.current.alerts.filter((a) => !ids.includes(a.sensorId ?? DEFAULT_SENSOR_ID)) : [];
    live.current = { ...live.current, alerts: next };
    setAlerts(next);
    void saveAlerts(next);
  }, []);

  const restartSensor = useCallback(
    (id: string) => {
      // Recomeça as leituras e liga a simulação; o cenário escolhido continua.
      updateSensor(id, (st) => ({ ...freshSensorState(sensorDefById(id)), scenario: st.scenario }));
      dropAlertsOf([id]);
    },
    [updateSensor, dropAlertsOf],
  );

  const setAllRunning = useCallback(
    (running: boolean) => {
      const cur = live.current.store;
      const next: SensorStore = {};
      for (const k of Object.keys(cur)) next[k] = { ...cur[k], running };
      commitStore(next);
    },
    [commitStore],
  );

  const restartAll = useCallback(() => {
    const cur = live.current.store;
    const next: SensorStore = {};
    for (const def of SENSORS) next[def.id] = { ...freshSensorState(def), scenario: cur[def.id]?.scenario ?? def.cenario };
    commitStore(next);
    dropAlertsOf(null);
    setDismissedId(null);
  }, [commitStore, dropAlertsOf]);

  const applyScenarioToAll = useCallback(
    (s: Scenario) => {
      const cur = live.current.store;
      const next: SensorStore = {};
      for (const k of Object.keys(cur)) next[k] = { ...cur[k], scenario: s, running: true };
      commitStore(next);
    },
    [commitStore],
  );

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
      sensors,
      sensorById,
      selectedSensorId,
      selectSensor: setSelectedSensorId,
      liveCount,
      sourceLabel,
      liveStatus,
      apiRainMm,
      alerts,
      banner,
      reports,
      setScenarioFor,
      toggleRun,
      stepNow,
      restartSensor,
      setAllRunning,
      restartAll,
      applyScenarioToAll,
      dismissBanner,
      addReport,
      reviewReport,
    }),
    [
      ready,
      sensors,
      sensorById,
      selectedSensorId,
      liveCount,
      sourceLabel,
      liveStatus,
      apiRainMm,
      alerts,
      banner,
      reports,
      setScenarioFor,
      toggleRun,
      stepNow,
      restartSensor,
      setAllRunning,
      restartAll,
      applyScenarioToAll,
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

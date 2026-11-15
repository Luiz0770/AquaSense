import React from 'react';
import { Tabs, TabList, TabSlot, TabTrigger } from 'expo-router/ui';
import { useMonitoring } from '@/contexts/MonitoringContext';
import { FloatingTabBar, TabButton } from '@/components/FloatingTabBar';

/** Abas do agente. O número na aba Relatos mostra quantos aguardam revisão. */
export default function AgenteLayout() {
  const { reports } = useMonitoring();
  const pendentes = reports.filter((r) => r.status === 'pendente').length;
  return (
    <Tabs>
      <TabSlot />
      <TabList asChild>
        <FloatingTabBar>
          <TabTrigger name="painel" href="/painel" asChild>
            <TabButton label="Painel" icon="radar" />
          </TabTrigger>
          <TabTrigger name="relatos" href="/relatos" asChild>
            <TabButton label="Relatos" icon="fact_check" badge={pendentes} />
          </TabTrigger>
          <TabTrigger name="simulacao" href="/simulacao" asChild>
            <TabButton label="Simular" icon="tune" />
          </TabTrigger>
          <TabTrigger name="leituras" href="/leituras" asChild>
            <TabButton label="Sensor" icon="sensors" />
          </TabTrigger>
          <TabTrigger name="canais" href="/canais" asChild>
            <TabButton label="Canais" icon="call" />
          </TabTrigger>
        </FloatingTabBar>
      </TabList>
    </Tabs>
  );
}

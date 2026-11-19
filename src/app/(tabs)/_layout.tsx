import React from 'react';
import { Tabs, TabList, TabSlot, TabTrigger } from 'expo-router/ui';
import { FloatingTabBar, TabButton, slotStyle } from '@/components/FloatingTabBar';

/** Abas do cidadão. Os TabTrigger ficam aqui, escritos direto, para o expo-router encontrá-los. */
export default function TabsLayout() {
  return (
    <Tabs>
      <TabSlot style={slotStyle} />
      <TabList asChild>
        <FloatingTabBar>
          <TabTrigger name="index" href="/" asChild>
            <TabButton label="Início" icon="water_drop" />
          </TabTrigger>
          <TabTrigger name="historico" href="/historico" asChild>
            <TabButton label="Histórico" icon="insights" />
          </TabTrigger>
          <TabTrigger name="sensor" href="/sensor" asChild>
            <TabButton label="Sensor" icon="sensors" />
          </TabTrigger>
          <TabTrigger name="relatar" href="/relatar" asChild>
            <TabButton label="Relatar" icon="add_a_photo" />
          </TabTrigger>
          <TabTrigger name="fontes" href="/fontes" asChild>
            <TabButton label="Canais" icon="call" />
          </TabTrigger>
        </FloatingTabBar>
      </TabList>
    </Tabs>
  );
}

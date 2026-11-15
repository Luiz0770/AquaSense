# Registro de prompts (IA)

Ferramenta: Claude (Anthropic). Este arquivo registra os prompts usados para gerar o app.
Acrescente aqui os prompts das outras sessões (ideação, telas no Claude Design, Wokwi) antes de entregar.

## 1. Criação do MVP a partir do design

**Objetivo:** gerar o app Expo do AquaSense seguindo as telas do arquivo `AquaSense Mobile v2.dc.html`, reaproveitando funcionalidades e ideias das conversas anteriores.

**Prompt:**
> Estou anexando a pasta onde eu quero que você faça a criação do meu projeto do AquaSense. Resgate todas as funcionalidades, objetivos e ideias que a gente teve e faça a criação de um MVP desse projeto nessa pasta com as telas orientadas abaixo. Base de telas: projeto do Claude Design, arquivo `AquaSense Mobile v2.dc.html` (importa `support.js`). Implement: `AquaSense Mobile v2.dc.html`.

**Resultado:** projeto Expo + TypeScript com 11 telas, simulador IoT, alertas por estado, relatos com validação do agente e opções de acessibilidade.

**O que foi conferido por quem entrega:** checagem de tipos, testes da lógica (`npm run check`), build do bundle Android e navegação nas telas em uma versão web de teste.

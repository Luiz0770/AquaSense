# AquaSense

Aplicativo mobile de **monitoramento de alagamentos** para a Global Solution 2026.2 da FIAP (desafio CitizenTech, Mobile Development & IoT).
O cidadão consulta o nível da água de um ponto monitorado, recebe alertas por estado e registra o que vê. O agente valida os relatos e controla a simulação.

> O AquaSense **não substitui** os alertas da Defesa Civil e do CGE. Os dados do sensor são **simulados** e as leituras são **estimativas não oficiais**.

## Ficha CitizenTech

**Problema.** Alagamentos urbanos em São Paulo pegam as pessoas de surpresa. O aviso oficial costuma chegar depois que a água já subiu, e quem está no local não tem uma leitura simples do nível da água nem um canal fácil para avisar o que vê.

**Quem se beneficia.** Moradores e pedestres de áreas alagáveis (cidadão) e agentes da Defesa Civil/CGE, que passam a ter leituras frequentes e relatos de campo já organizados.

**Hipóteses.**
1. Uma leitura contínua do nível da água, com estados claros (Normal, Atenção, Alerta, Crítico), ajuda o cidadão a decidir mais cedo se deve evitar um ponto.
2. Relatos do cidadão, marcados como "não verificado" até um agente validar, complementam o sensor sem se passar por informação oficial.
3. Estados comunicados por ícone, palavra e cor (nunca só cor) e com texto ajustável tornam o alerta compreensível para mais pessoas.

**Indicadores (para validar com usuários).**
- Tempo entre a mudança de estado e a abertura do alerta pelo usuário.
- Relatos enviados por sessão e proporção validada pelo agente.
- Conclusão da tarefa "descobrir o nível atual" sem ajuda, em até 10 segundos.
- Uso das opções de acessibilidade (tamanho do texto, alto contraste).

## Funcionalidades (MVP)

| Perfil | Tela | O que faz |
| --- | --- | --- |
| Todos | Login e Cadastro | E-mail e senha com validação; cadastro com telefone (máscara) e perfil (cidadão ou agente) |
| Cidadão | Início | Holograma da rua (casas, pessoa de 1,70 m e água subindo), nível em cm, chuva, tendência, faixas de risco e previsão de chuva (Open-Meteo) |
| Cidadão | Histórico | Chuva e nível em 7 dias ou 24 h e alagamentos registrados (dados de demonstração) |
| Todos | Sensor | Holograma do nível, gráficos ao vivo, últimas leituras e JSON bruto do ESP32 simulado (uma a cada 5 s) |
| Cidadão | Relatar | Tipo do relato, foto (demonstração), CEP, data/hora, altura (cm) e detalhes, com máscaras e validação; lista "Meus relatos" |
| Todos | Canais | Defesa Civil 199, SMS 40199, CGE, Bombeiros 193, origem dos dados e legenda das faixas |
| Agente | Painel | Radar dos pontos, relatos pendentes, cenário atual e mudanças de estado |
| Agente | Relatos | Filtro Aguardando/Todos; validar ou descartar relatos |
| Agente | Simulação | Cenário (sem chuva, moderada, forte), pausar, nova leitura na hora e reiniciar |
| Todos | Perfil | Tamanho do texto, alto contraste, reduzir movimento, trocar para a conta demo do outro perfil, sair |

**Estados do nível da água** (limiares de demonstração): Normal < 20 cm, Atenção ≥ 20 cm, Alerta ≥ 40 cm, Crítico ≥ 70 cm.
Cada mudança de estado gera um evento de alerta e um banner.

**Privacidade.** O app pede só CEP e telefone. Não coleta CPF nem endereço.

## Como rodar

Requisitos: Node 20+ e o app **Expo Go** no celular (ou um emulador).

```bash
npm install
npx expo start
```

Escaneie o QR code com o Expo Go (Android) ou com a câmera (iOS).

Contas de demonstração (já criadas na primeira abertura):

| Perfil | E-mail | Senha |
| --- | --- | --- |
| Cidadão | `cidadao@exemplo.com` | `123456` |
| Agente | `agente@exemplo.com` | `123456` |

Também há o atalho **Ver como agente (demonstração)** na tela de login.

Outros comandos:

```bash
npm run typecheck   # checagem de tipos
npm run check       # testes da lógica (máscaras, validadores, simulador, alertas)
```

Para ver o alerta de nível, abra o perfil de agente, vá em **Simulação** e escolha **Forte**: em cerca de um minuto o estado sobe até Crítico.

## API de previsão

A previsão de chuva do card "Previsão de chuva" (tela Início) usa a API gratuita [Open-Meteo](https://open-meteo.com/) (sem chave, sem cadastro), com `fetch` nativo em `src/services/weather.ts`.

- **Localização aproximada e privacidade**: a previsão usa, por padrão, a localização aproximada do usuário (permissão em primeiro plano, via `expo-location`); o bairro/cidade dele aparece no hero da tela Início no lugar do nome do ponto piloto. A localização nunca é salva nem enviada para nenhum servidor além das coordenadas arredondadas para 2 casas decimais na própria chamada à Open-Meteo — nunca é registrada em log. No primeiro login depois da instalação o app pede a localização atual e a usa como local padrão; se a pessoa negar, segue no PT-07 sem insistir, e quem já escolheu um local antes mantém a escolha. Sem permissão, com a permissão negada, com o GPS desligado ou em caso de erro, a previsão cai automaticamente para as coordenadas fixas do ponto PT-07 (Ipiranga/SP), sem nenhuma ação do usuário. No Android só é solicitada localização aproximada (coarse); em nenhuma plataforma é pedida permissão de localização em segundo plano.
- As coordenadas do ponto PT-07 (fallback) ficam em `WEATHER_LAT`/`WEATHER_LON` em `src/services/weather.ts` e podem ser trocadas sem alterar código, definindo `EXPO_PUBLIC_WEATHER_LAT` e `EXPO_PUBLIC_WEATHER_LON` num arquivo `.env`.
- O hook `useForecast()` (`src/hooks/useForecast.ts`) mantém os dados em cache por 10 minutos por local (chave = coordenadas arredondadas) e busca de novo ao voltar para a aba Início.
- Sem internet ou se a API falhar, o card usa o último dado em cache ou a previsão simulada de `src/data/forecast.ts`, com o aviso discreto "Sem conexão · exibindo dados simulados".

Dados meteorológicos: © [Open-Meteo.com](https://open-meteo.com/), licença [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).

## Arquitetura

- **Expo SDK 58, React Native e TypeScript**, rotas com Expo Router (`src/app`): grupos `(auth)`, `(tabs)` do cidadão e `(agente)`.
- **Contextos**: `SettingsContext` (tema e acessibilidade), `AuthContext` (sessão) e `MonitoringContext` (leituras, estado, alertas e relatos).
- **Serviços** (`src/services`): autenticação local com hash SHA-256 (`expo-crypto`), leituras, alertas, relatos e ajustes. Tudo grava no `AsyncStorage` por meio de `storage.ts`.
- **IoT simulado** (`src/services/iot`): o simulador gera `{sensorId, nivelCm, chuvaMm, timestamp}` a cada 5 s conforme o cenário. Os limiares ficam em `thresholds.ts`.
- **Interface** (`src/components`): segue o design "AquaSense Mobile v2" (Claude Design). Fontes Sora, Atkinson Hyperlegible e JetBrains Mono; ícones Material Symbols Rounded em SVG (`components/icons/glyphs.ts`); hologramas, radar e gráficos em `react-native-svg` com animações do `Animated` (desligadas em "Reduzir movimento"). Telas usadas pelos dois perfis ficam em `src/screens`.
- **Acessibilidade**: estado por ícone + palavra, alvos de toque de 48 dp, texto Normal/Grande/Muito grande, alto contraste, reduzir movimento, rótulos e papéis de acessibilidade.
- **Proteção de rotas**: o `AuthGate` redireciona conforme a sessão e o perfil.

```
src/
  app/          rotas (auth, tabs, agente, perfil)
  components/   interface reutilizável
  contexts/     configurações, autenticação, monitoramento
  services/     armazenamento, auth, relatos, alertas, iot/
  hooks/ utils/ styles/ data/ types/
scripts/check-logic.ts
```

## Limitações conhecidas

- O sensor é simulado. A integração com o ESP32 real (Wokwi/MQTT) é um próximo passo; o formato da leitura já é o do simulador.
- Os limiares 20/40/70 cm são valores de demonstração e devem ser confirmados com o circuito do sensor.
- Os dados de histórico e ocorrências são de demonstração.
- Contas e relatos ficam só no aparelho (sem servidor).

## Telas

<!-- Adicione aqui os prints: login, início (Normal e Alerta), relatar, painel do agente, simulação. -->

## Entrega

Vídeo (até 3 min): _adicionar link_ · Registro de prompts: [prompts.md](prompts.md)

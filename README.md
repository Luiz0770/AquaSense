# AquaSense

Aplicativo mobile de **monitoramento de alagamentos** para a Global Solution 2026.2 da FIAP (desafio CitizenTech, Mobile Development & IoT).
O cidadão consulta o nível da água de um ponto monitorado, recebe alertas por estado e registra o que vê. O agente valida os relatos e controla a simulação.

> O AquaSense **não substitui** os alertas da Defesa Civil e do CGE. Os dados dos sensores são **simulados** (ou vêm de um ESP32 simulado no Wokwi) e as leituras são **estimativas não oficiais**.

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
| Todos | Sensor | Os 3 sensores (Sensor 1, 2 e 3): filtro por faixa, faixa rolável, holograma do sensor escolhido com ‹ ›, gráficos ao vivo, últimas leituras e JSON bruto; o agente vê também o ranking de todos os sensores |
| Cidadão | Relatar | Tipo do relato, foto (demonstração), CEP, data/hora, altura (cm) e detalhes, com máscaras e validação; lista "Meus relatos" |
| Todos | Canais | Defesa Civil 199, SMS 40199, CGE, Bombeiros 193, origem dos dados e legenda das faixas |
| Agente | Painel | Hero com radar (toque num sensor para ver os valores dele), sensores do pior para o melhor com mini-gráfico, relatos pendentes e mudanças de estado por sensor |
| Agente | Relatos | Filtro Aguardando/Todos; validar ou descartar relatos |
| Agente | Simulação | Por sensor: cenário (clima real, sem chuva, moderada, forte, extrema), pausar, nova leitura na hora e reiniciar; em lote: pausar/retomar, reiniciar e usar o mesmo cenário em todos |
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

Para ver o alerta de nível, abra o perfil de agente, vá em **Simulação** e escolha **Extrema**: em cerca de um minuto o estado sobe, passando por Atenção e Alerta, até Crítico (cada mudança gera um alerta). Os cenários **Moderada** e **Forte** deixam o sensor parado em Atenção e Alerta; **Clima real** usa a chuva da Open-Meteo e mantém o nível em Normal.

## API de previsão

A previsão de chuva do card "Previsão de chuva" (tela Início) usa a API gratuita [Open-Meteo](https://open-meteo.com/) (sem chave, sem cadastro), com `fetch` nativo em `src/services/weather.ts`.

- **Localização aproximada e privacidade**: a previsão usa, por padrão, a localização aproximada do usuário (permissão em primeiro plano, via `expo-location`); o bairro/cidade dele aparece no hero da tela Início no lugar do nome do sensor. A localização nunca é salva nem enviada para nenhum servidor além das coordenadas arredondadas para 2 casas decimais na própria chamada à Open-Meteo — nunca é registrada em log. No primeiro login depois da instalação o app pede a localização atual e a usa como local padrão; se a pessoa negar, segue no Sensor 1 sem insistir, e quem já escolheu um local antes mantém a escolha. Sem permissão, com a permissão negada, com o GPS desligado ou em caso de erro, a previsão cai automaticamente para as coordenadas fixas do Sensor 1 (Ipiranga/SP), sem nenhuma ação do usuário. No Android só é solicitada localização aproximada (coarse); em nenhuma plataforma é pedida permissão de localização em segundo plano.
- As coordenadas do Sensor 1 (fallback) ficam em `WEATHER_LAT`/`WEATHER_LON` em `src/services/weather.ts` e podem ser trocadas sem alterar código, definindo `EXPO_PUBLIC_WEATHER_LAT` e `EXPO_PUBLIC_WEATHER_LON` num arquivo `.env`.
- O hook `useForecast()` (`src/hooks/useForecast.ts`) mantém os dados em cache por 10 minutos por local (chave = coordenadas arredondadas) e busca de novo ao voltar para a aba Início.
- Sem internet ou se a API falhar, o card usa o último dado em cache ou a previsão simulada de `src/data/forecast.ts`, com o aviso discreto "Sem conexão · exibindo dados simulados".

Dados meteorológicos: © [Open-Meteo.com](https://open-meteo.com/), licença [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).

## Arquitetura

- **Expo SDK 58, React Native e TypeScript**, rotas com Expo Router (`src/app`): grupos `(auth)`, `(tabs)` do cidadão e `(agente)`.
- **Contextos**: `SettingsContext` (tema e acessibilidade), `AuthContext` (sessão) e `MonitoringContext` (leituras, cenário e pausa de cada sensor, alertas e relatos). A tela Início usa o `useHomeSensor` (Sensor 1, ou o sensor escolhido em "Sua localização").
- **Serviços** (`src/services`): autenticação local com hash SHA-256 (`expo-crypto`), leituras, alertas, relatos e ajustes. Tudo grava no `AsyncStorage` por meio de `storage.ts`.
- **Sensores** (`src/data/sensors.ts`): 3 sensores ultrassônicos HC-SR04 (`sensor-1`, `sensor-2`, `sensor-3`), cada um com posição no radar e um fator de alagamento. Para ter mais sensores, basta acrescentar itens nessa lista (e no `sketch.ino`/Node-RED); as telas já rolam e filtram.
- **IoT** (`src/services/iot`): o simulador gera `{sensorId, nivelCm, chuvaMm, timestamp}` a cada 5 s para cada sensor ligado. O nível não é sorteado: ele caminha devagar (15% do caminho por leitura, cerca de 1 min) até o alvo do cenário e fica parado ali, variando no máximo 0,2 cm. No cenário padrão, **Clima real**, a chuva vem da Open-Meteo (chuva da hora atual no local dos sensores, atualizada a cada 15 min): sem chuva o nível fica na água parada do sensor e, com chuva, sobe no máximo 5 cm, sem nunca sair da faixa Normal. Os cenários Sem chuva, Moderada, Forte e Extrema deixam o sensor parado em Normal, Atenção, Alerta e Crítico, sempre a pelo menos 3 cm das bordas (20/40/70 cm). Assim a faixa só muda quando o agente troca o cenário ou quando o ESP32 (Wokwi/Node-RED) manda outro nível. A chuva é uma só para a região. O app também assina o tópico MQTT `fiap2026/aquasense` (HiveMQ): o ESP32 do Wokwi manda uma mensagem por sensor, e cada sensor que chega passa a "Ao vivo (ESP32)" e deixa de ser simulado. Se o Wokwi parar de mandar um sensor por 15 s, ele volta para o simulador sozinho. Ids antigos (`ESP32-01`, `PT-07`, `PT-11`, `PT-03`) são aceitos. Os limiares ficam em `thresholds.ts`.
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

- Sem o Wokwi rodando, os sensores são simulados no próprio app. Com ele rodando (pasta `wokwi/`, com o painel de controle em `node-red/`), cada um dos 3 sensores passa a mostrar os dados reais do ESP32 por MQTT.
- Os limiares 20/40/70 cm são valores de demonstração e devem ser confirmados com o circuito do sensor.
- Os dados de histórico e ocorrências são de demonstração.
- Contas e relatos ficam só no aparelho (sem servidor).

## Telas

Prints do app (pasta `docs/prints/`).

**Cidadão**

| Login | Início (Normal) | Início (Alerta) |
| --- | --- | --- |
| ![Login](docs/prints/01-login.png) | ![Início em Normal](docs/prints/02-inicio-normal.png) | ![Início em Alerta](docs/prints/03-inicio-alerta.png) |

| Sensor (carrossel) | Relatar | Histórico |
| --- | --- | --- |
| ![Sensor](docs/prints/04-sensor.png) | ![Relatar](docs/prints/05-relatar.png) | ![Histórico](docs/prints/06-historico.png) |

**Agente**

| Painel (radar) | Relatos | Detalhe do relato |
| --- | --- | --- |
| ![Painel](docs/prints/07-painel.png) | ![Relatos](docs/prints/08-relatos.png) | ![Detalhe do relato](docs/prints/09-relato.png) |

| Simulação | Sensor (visão do agente) | Acessibilidade (Perfil) |
| --- | --- | --- |
| ![Simulação](docs/prints/10-simulacao.png) | ![Sensor do agente](docs/prints/11-sensor-agente.png) | ![Perfil](docs/prints/12-perfil.png) |

## Entrega

Vídeo (até 3 min): _adicionar link_ · Registro de prompts: [prompts.md](prompts.md)

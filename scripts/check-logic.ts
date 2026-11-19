/// <reference types="node" />
/**
 * Verificação rápida da lógica pura (sem celular): máscaras, validadores, limiares,
 * simulador IoT e alertas. Rode com: npm run check
 */
import assert from 'node:assert/strict';
import { maskCep, maskDateTime, maskPhone, maskHeight } from '../src/utils/masks';
import {
  parseDateTime,
  validateCep,
  validateDateTime,
  validateEmail,
  validateHeight,
  validatePassword,
  validatePhone,
} from '../src/utils/validators';
import { levelFor, LIMITS } from '../src/services/iot/thresholds';
import { initialReading, nextReading, PROFILES } from '../src/services/iot/simulator';
import { buildAlert } from '../src/services/iot/alerts';
import { parseLivePayload } from '../src/services/iot/liveSource';
import { liveHourFromRain } from '../src/data/forecast';
import { addRecentSearch, MAX_RECENT_SEARCHES, sanitizeRecentSearches } from '../src/utils/recentSearches';
import { isPermissionDenied, shouldRequestLocationOnLogin } from '../src/utils/locationOnboarding';
import { hasReportPhoto, reportNumber } from '../src/utils/reports';
import type { Scenario } from '../src/types';
import { SENSORS, resolveSensorId } from '../src/data/sensors';
import { normalizeSensorStore, toSaved, withReading, MAX_READINGS_PER_SENSOR } from '../src/services/iot/sensorStore';
import { regionalRain, targetLevel } from '../src/services/iot/simulator';

let n = 0;
const ok = (name: string, fn: () => void) => {
  fn();
  n += 1;
  console.log(`ok  ${name}`);
};

ok('máscara de CEP', () => {
  assert.equal(maskCep('01000000'), '01000-000');
  assert.equal(maskCep('01000-0'), '01000-0');
  assert.equal(maskCep('abc0100'), '0100');
  assert.equal(maskCep('010000009999'), '01000-000');
});

ok('máscara de telefone', () => {
  assert.equal(maskPhone('11900001111'), '(11) 90000-1111');
  assert.equal(maskPhone('1130001111'), '(11) 3000-1111');
  assert.equal(maskPhone('1'), '(1');
  assert.equal(maskPhone(''), '');
});

ok('máscara de data e hora', () => {
  assert.equal(maskDateTime('131120262210'), '13/11/2026 22:10');
  assert.equal(maskDateTime('1311'), '13/11');
  assert.equal(maskHeight('1a5x'), '15');
});

ok('validadores', () => {
  assert.equal(validateCep('01000-000'), null);
  assert.match(validateCep('0100') ?? '', /8 números/);
  assert.equal(validateEmail('a@b.co'), null);
  assert.notEqual(validateEmail('a@b'), null);
  assert.equal(validatePassword('123456'), null);
  assert.notEqual(validatePassword('123'), null);
  assert.equal(validatePhone('(11) 90000-0000'), null);
  assert.notEqual(validatePhone('(11) 9000'), null);
  assert.equal(validateHeight('15'), null);
  assert.notEqual(validateHeight('abc'), null);
  assert.notEqual(validateHeight('0'), null);
  assert.notEqual(validateHeight('301'), null);
});

ok('data e hora: existência e futuro', () => {
  assert.ok(parseDateTime('13/11/2026 22:10'));
  assert.equal(parseDateTime('31/02/2026 10:00'), null);
  assert.equal(parseDateTime('13/11/2026 25:00'), null);
  const now = new Date(2026, 10, 15, 12, 0);
  assert.equal(validateDateTime('15/11/2026 11:00', now), null);
  assert.match(validateDateTime('16/11/2026 11:00', now) ?? '', /futuro/);
});

ok('limiares de demonstração', () => {
  assert.equal(LIMITS.atencao, 20);
  assert.equal(levelFor(19), 'normal');
  assert.equal(levelFor(20), 'atencao');
  assert.equal(levelFor(39), 'atencao');
  assert.equal(levelFor(40), 'alerta');
  assert.equal(levelFor(69), 'alerta');
  assert.equal(levelFor(70), 'critico');
});

ok('simulador: formato da leitura e limites', () => {
  const r = nextReading(initialReading(), 'moderada');
  assert.deepEqual(Object.keys(r).sort(), ['chuvaMm', 'id', 'nivelCm', 'sensorId', 'timestamp']);
  assert.ok(r.nivelCm >= 0 && r.nivelCm <= 100);
});

ok('simulador: cada cenário para numa faixa e não troca de faixa depois de parado', () => {
  const esperado: Record<Scenario, string> = { real: 'normal', sem_chuva: 'normal', moderada: 'atencao', forte: 'alerta', extrema: 'critico' };
  for (const sc of Object.keys(PROFILES) as Scenario[]) {
    for (const fator of [0.75, 1, 1.25]) {
      let r = initialReading(new Date(), 'sensor-1', 9);
      for (let i = 0; i < 60; i++) r = nextReading(r, sc, new Date(), Math.random, { fator, base: 9, apiRainMm: 3 });
      // Depois de chegar, 500 leituras (≈ 40 min) sem nenhuma troca de faixa.
      for (let i = 0; i < 500; i++) {
        r = nextReading(r, sc, new Date(), Math.random, { fator, base: 9, apiRainMm: 3 });
        assert.equal(levelFor(r.nivelCm), esperado[sc], `${sc} fator ${fator}: ${r.nivelCm} cm`);
      }
    }
  }
});

ok('simulador: nível estável depois de parado (só alguns milímetros por leitura)', () => {
  let r = initialReading(new Date(), 'sensor-1', 9);
  for (let i = 0; i < 60; i++) r = nextReading(r, 'moderada');
  for (let i = 0; i < 200; i++) {
    const n = nextReading(r, 'moderada');
    assert.ok(Math.abs(n.nivelCm - r.nivelCm) <= 0.35, `${r.nivelCm} → ${n.nivelCm}`);
    r = n;
  }
});

ok('simulador: clima real (Open-Meteo) sobe pouco com a chuva e nunca sai de Normal', () => {
  assert.equal(targetLevel('real', { base: 9, apiRainMm: 0 }), 9);
  assert.equal(targetLevel('real', { base: 9, apiRainMm: 4 }), 11);
  assert.ok(targetLevel('real', { base: 12, fator: 1.25, apiRainMm: 80 }) < 20);
  assert.ok(targetLevel('real', { base: 30, apiRainMm: 80 }) < 20);
  // Sem dado da API (sem internet): fica na água parada do sensor.
  assert.equal(targetLevel('real', { base: 6, apiRainMm: null }), 6);
});

ok('simulador: trocar de cenário leva cerca de 1 min, sem pular faixas', () => {
  let r = initialReading(new Date(), 'sensor-1', 9);
  const faixas: string[] = [levelFor(r.nivelCm)];
  let leituras = 0;
  while (levelFor(r.nivelCm) !== 'critico' && leituras < 100) {
    r = nextReading(r, 'extrema');
    leituras++;
    const f = levelFor(r.nivelCm);
    if (f !== faixas[faixas.length - 1]) faixas.push(f);
  }
  assert.deepEqual(faixas, ['normal', 'atencao', 'alerta', 'critico']);
  assert.ok(leituras >= 6 && leituras <= 30, `${leituras} leituras`);
});

ok('simulador: chuva da região (API no clima real, cenário mais chuvoso nos outros)', () => {
  assert.equal(regionalRain(['real', 'real'], 3.4), 3.4);
  assert.equal(regionalRain(['real', 'sem_chuva'], null), 0);
  const r = regionalRain(['real', 'forte', 'moderada'], 1, () => 0.5);
  assert.equal(r, PROFILES.forte.rainMm);
  assert.equal(regionalRain(['sem_chuva'], 50), 0);
});

ok('alertas: texto de subida e de descida', () => {
  const r = { ...initialReading(), nivelCm: 27 };
  assert.equal(buildAlert('normal', 'atencao', r).mensagem, 'Mudou para Atenção, com 27 cm.');
  assert.equal(buildAlert('atencao', 'normal', { ...r, nivelCm: 18 }).mensagem, 'Voltou para Normal, com 18 cm.');
});

ok('MQTT: aceita o JSON do ESP32 e descarta mensagens inválidas', () => {
  assert.deepEqual(parseLivePayload('{"sensorId":"sensor-2","nivelCm":32.46,"chuvaMm":12.4,"seq":3}'), {
    sensorId: 'sensor-2',
    nivelCm: 32.5,
    chuvaMm: 12.4,
  });
  assert.equal(parseLivePayload('oi'), null);
  assert.equal(parseLivePayload('[1,2]'), null);
  assert.equal(parseLivePayload('{"nivelCm":"10","chuvaMm":1}'), null);
  assert.equal(parseLivePayload('{"nivelCm":-5,"chuvaMm":1}'), null);
  assert.equal(parseLivePayload('{"nivelCm":10,"chuvaMm":9999}'), null);
  assert.equal(parseLivePayload('{"sensorId":"<script>","nivelCm":10,"chuvaMm":1}'), null);
  assert.equal(parseLivePayload('{"sensorId":"sensor-9","nivelCm":10,"chuvaMm":1}'), null);
  // Firmware antigo: sem id ou com os ids antigos.
  assert.equal(parseLivePayload('{"nivelCm":10,"chuvaMm":1}')?.sensorId, 'sensor-1');
  assert.equal(parseLivePayload('{"sensorId":"ESP32-01","nivelCm":10,"chuvaMm":1}')?.sensorId, 'sensor-1');
  assert.equal(parseLivePayload('{"sensorId":"PT-11","nivelCm":10,"chuvaMm":1}')?.sensorId, 'sensor-2');
  assert.equal(parseLivePayload('{"sensorId":" Sensor-3 ","nivelCm":10,"chuvaMm":1}')?.sensorId, 'sensor-3');
});

ok('previsão: "Em 1 h" segue a chuva medida pelo ESP32', () => {
  const base = { hora: 15, prob: 35, mm: 0.4, icon: 'cloud' as const };
  assert.deepEqual(liveHourFromRain(base, 0), { hora: 15, prob: 0, mm: 0, icon: 'partly_cloudy_day' });
  assert.deepEqual(liveHourFromRain(base, 3), { hora: 15, prob: 15, mm: 3, icon: 'rainy' });
  assert.deepEqual(liveHourFromRain(base, 12.44), { hora: 15, prob: 62, mm: 12.4, icon: 'thunderstorm' });
  assert.equal(liveHourFromRain(base, 50).prob, 100);
  assert.equal(liveHourFromRain(base, -2).mm, 0);
});

ok('buscas recentes: mais nova no topo, sem repetir e com limite', () => {
  const mk = (name: string) => ({ id: `busca:${name}`, name, subtitle: 'Endereço digitado por você', lat: -23.5, lon: -46.6 });
  let list = [] as ReturnType<typeof sanitizeRecentSearches>;
  for (const nome of ['Rua A', 'Rua B', 'Rua C']) list = addRecentSearch(list, mk(nome));
  assert.deepEqual(list.map((x) => x.name), ['Rua C', 'Rua B', 'Rua A']);
  list = addRecentSearch(list, mk('rua a'));
  assert.deepEqual(list.map((x) => x.name), ['rua a', 'Rua C', 'Rua B']);
  for (const nome of ['D', 'E', 'F', 'G']) list = addRecentSearch(list, mk(nome));
  assert.equal(list.length, MAX_RECENT_SEARCHES);
  assert.equal(list[0].name, 'G');
});

ok('buscas recentes: descarta dado inválido vindo do AsyncStorage', () => {
  assert.deepEqual(sanitizeRecentSearches('x'), []);
  assert.deepEqual(sanitizeRecentSearches(null), []);
  const good = { id: 'busca:rua', name: '  Rua Silva Bueno ', subtitle: 's', lat: -23.58, lon: -46.6 };
  const out = sanitizeRecentSearches([good, { ...good, lat: 'x' }, { ...good, lat: 99 }, { ...good, name: '   ' }, 7, null]);
  assert.equal(out.length, 1);
  assert.equal(out[0].name, 'Rua Silva Bueno');
});

ok('localização no primeiro login: só pede uma vez e respeita quem já escolheu', () => {
  assert.equal(shouldRequestLocationOnLogin(false, false), true);
  assert.equal(shouldRequestLocationOnLogin(true, false), false);
  assert.equal(shouldRequestLocationOnLogin(false, true), false);
  assert.equal(isPermissionDenied(Object.assign(new Error('x'), { code: 'permission-denied' })), true);
  assert.equal(isPermissionDenied(new Error('GPS desligado')), false);
  assert.equal(isPermissionDenied(null), false);
});

ok('relatos: foto real, marca antiga de foto e número curto', () => {
  assert.equal(hasReportPhoto({ fotoUri: 'file:///foto.jpg' }), true);
  assert.equal(hasReportPhoto({ comFoto: true }), true);
  assert.equal(hasReportPhoto({}), false);
  assert.equal(reportNumber('rep-m3x9k2-ab12cd'), '12CD');
  assert.equal(reportNumber('a1'), '00A1');
});

ok('sensores: 3 sensores, nomes "Sensor N" e ids antigos convertidos', () => {
  assert.deepEqual(SENSORS.map((s) => s.nome), ['Sensor 1', 'Sensor 2', 'Sensor 3']);
  assert.equal(resolveSensorId('PT-07'), 'sensor-1');
  assert.equal(resolveSensorId('esp32-01'), 'sensor-1');
  assert.equal(resolveSensorId('PT-03'), 'sensor-3');
  assert.equal(resolveSensorId('xyz'), null);
  assert.equal(resolveSensorId(42), null);
});

ok('sensores: cada um com suas leituras; dados do simulador antigo são descartados', () => {
  const fresh = normalizeSensorStore(null);
  assert.deepEqual(Object.keys(fresh), ['sensor-1', 'sensor-2', 'sensor-3']);
  for (const def of SENSORS) {
    assert.equal(fresh[def.id].readings.length, 1);
    assert.equal(fresh[def.id].readings[0].sensorId, def.id);
    assert.equal(fresh[def.id].readings[0].nivelCm, def.base);
    assert.equal(fresh[def.id].scenario, 'real');
    assert.equal(levelFor(def.base), 'normal');
  }
  // Formato antigo (sem versão): começa do zero.
  const antigo = normalizeSensorStore({ 'sensor-2': { readings: [{ ...initialReading(), nivelCm: 50 }], scenario: 'forte', running: false } });
  assert.equal(antigo['sensor-2'].readings[0].nivelCm, SENSORS[1].base);
  assert.equal(antigo['sensor-2'].scenario, 'real');
  // Formato novo: mantém; dado estranho é descartado.
  const saved = normalizeSensorStore(toSaved({ ...fresh, 'sensor-2': { readings: [{ ...initialReading(), nivelCm: 50 }, 'lixo' as never], scenario: 'xx' as never, running: false } }));
  assert.equal(saved['sensor-2'].readings.length, 1);
  assert.equal(saved['sensor-2'].readings[0].nivelCm, 50);
  assert.equal(saved['sensor-2'].scenario, 'real');
  assert.equal(saved['sensor-2'].running, false);
  const s2 = normalizeSensorStore(toSaved({ ...fresh, 'sensor-3': { ...fresh['sensor-3'], scenario: 'extrema' } }));
  assert.equal(s2['sensor-3'].scenario, 'extrema');
  let st = fresh;
  for (let i = 0; i < MAX_READINGS_PER_SENSOR + 5; i++) st = withReading(st, 'sensor-3', initialReading(new Date(), 'sensor-3'));
  assert.equal(st['sensor-3'].readings.length, MAX_READINGS_PER_SENSOR);
  assert.equal(st['sensor-1'], fresh['sensor-1']);
});

ok('sensores: o fator muda a posição dentro da faixa, nunca a faixa', () => {
  for (const sc of ['moderada', 'forte', 'extrema'] as Scenario[]) {
    const lo = targetLevel(sc, { fator: 0.75 });
    const hi = targetLevel(sc, { fator: 1.25 });
    assert.ok(hi > lo, `${sc}: ${lo} < ${hi}`);
    assert.equal(levelFor(lo), levelFor(hi));
  }
});

console.log(`\n${n} verificações passaram.`);

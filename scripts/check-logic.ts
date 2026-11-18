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
import type { Scenario } from '../src/types';

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

ok('simulador: chuva forte chega ao Crítico; sem chuva volta ao Normal', () => {
  let r = initialReading();
  for (let i = 0; i < 25; i++) r = nextReading(r, 'forte');
  assert.equal(levelFor(r.nivelCm), 'critico');
  for (let i = 0; i < 25; i++) r = nextReading(r, 'sem_chuva');
  assert.equal(levelFor(r.nivelCm), 'normal');
});

ok('simulador: chuva moderada fica em Atenção ou Normal, sem chegar ao Crítico', () => {
  let r = initialReading();
  for (let i = 0; i < 200; i++) {
    r = nextReading(r, 'moderada');
    assert.notEqual(levelFor(r.nivelCm), 'critico');
  }
});

ok('simulador: chuva em mm dentro da faixa do cenário', () => {
  (Object.keys(PROFILES) as Scenario[]).forEach((s) => {
    let r = initialReading();
    for (let i = 0; i < 50; i++) {
      r = nextReading(r, s);
      assert.ok(r.chuvaMm >= PROFILES[s].rainMin && r.chuvaMm <= PROFILES[s].rainMax, `${s}: ${r.chuvaMm}`);
    }
  });
});

ok('alertas: texto de subida e de descida', () => {
  const r = { ...initialReading(), nivelCm: 27 };
  assert.equal(buildAlert('normal', 'atencao', r).mensagem, 'Mudou para Atenção, com 27 cm.');
  assert.equal(buildAlert('atencao', 'normal', { ...r, nivelCm: 18 }).mensagem, 'Voltou para Normal, com 18 cm.');
});

ok('MQTT: aceita o JSON do ESP32 e descarta mensagens inválidas', () => {
  assert.deepEqual(parseLivePayload('{"sensorId":"ESP32-01","nivelCm":32.46,"chuvaMm":12.4,"seq":3}'), {
    sensorId: 'ESP32-01',
    nivelCm: 32.5,
    chuvaMm: 12.4,
  });
  assert.equal(parseLivePayload('oi'), null);
  assert.equal(parseLivePayload('[1,2]'), null);
  assert.equal(parseLivePayload('{"nivelCm":"10","chuvaMm":1}'), null);
  assert.equal(parseLivePayload('{"nivelCm":-5,"chuvaMm":1}'), null);
  assert.equal(parseLivePayload('{"nivelCm":10,"chuvaMm":9999}'), null);
  assert.equal(parseLivePayload('{"sensorId":"<script>","nivelCm":10,"chuvaMm":1}')?.sensorId, 'ESP32-01');
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

console.log(`\n${n} verificações passaram.`);

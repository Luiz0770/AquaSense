/**
 * Cliente MQTT 3.1.1 mínimo sobre WebSocket, só para ASSINAR um tópico (QoS 0).
 * Sem dependências: usa o WebSocket nativo do React Native (o mesmo da web).
 * Reconecta sozinho, com espera crescente, até `close()` ser chamado.
 */

export type MqttStatus = 'desconectado' | 'conectando' | 'conectado';

export interface MqttOptions {
  /** Ex.: wss://broker.hivemq.com:8884/mqtt */
  url: string;
  topic: string;
  onMessage: (topic: string, payload: string) => void;
  onStatus?: (status: MqttStatus) => void;
  keepAliveSec?: number;
  clientIdPrefix?: string;
}

export interface MqttSubscription {
  close: () => void;
}

// ---------- codificação ----------

function utf8Encode(s: string): number[] {
  const out: number[] = [];
  for (const ch of s) {
    const c = ch.codePointAt(0) ?? 0;
    if (c < 0x80) out.push(c);
    else if (c < 0x800) out.push(0xc0 | (c >> 6), 0x80 | (c & 63));
    else if (c < 0x10000) out.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
    else out.push(0xf0 | (c >> 18), 0x80 | ((c >> 12) & 63), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
  }
  return out;
}

function utf8Decode(b: Uint8Array): string {
  let s = '';
  let i = 0;
  while (i < b.length) {
    const c = b[i++];
    let cp: number;
    if (c < 0x80) cp = c;
    else if (c >= 0xf0) cp = ((c & 7) << 18) | ((b[i++] & 63) << 12) | ((b[i++] & 63) << 6) | (b[i++] & 63);
    else if (c >= 0xe0) cp = ((c & 15) << 12) | ((b[i++] & 63) << 6) | (b[i++] & 63);
    else cp = ((c & 31) << 6) | (b[i++] & 63);
    s += String.fromCodePoint(cp);
  }
  return s;
}

/** String MQTT: 2 bytes de tamanho + UTF-8. */
function mqttString(s: string): number[] {
  const b = utf8Encode(s);
  return [b.length >> 8, b.length & 255, ...b];
}

/** "Remaining length" de tamanho variável. */
function remainingLength(n: number): number[] {
  const out: number[] = [];
  do {
    let byte = n % 128;
    n = Math.floor(n / 128);
    if (n > 0) byte |= 128;
    out.push(byte);
  } while (n > 0);
  return out;
}

function packet(header: number, body: number[]): Uint8Array {
  return new Uint8Array([header, ...remainingLength(body.length), ...body]);
}

const connectPacket = (clientId: string, keepAlive: number) =>
  // "MQTT", nível 4 (3.1.1), clean session, keep alive, client id
  packet(0x10, [...mqttString('MQTT'), 4, 0x02, keepAlive >> 8, keepAlive & 255, ...mqttString(clientId)]);
const subscribePacket = (topic: string) => packet(0x82, [0, 1, ...mqttString(topic), 0]);
const PINGREQ = new Uint8Array([0xc0, 0]);
const DISCONNECT = new Uint8Array([0xe0, 0]);

// ---------- cliente ----------

export function subscribeMqtt(opts: MqttOptions): MqttSubscription {
  const keepAlive = opts.keepAliveSec ?? 30;
  let ws: WebSocket | null = null;
  let closed = false;
  let attempt = 0;
  let buf = new Uint8Array(0);
  let lastRx = 0;
  let pingTimer: ReturnType<typeof setInterval> | null = null;
  let retryTimer: ReturnType<typeof setTimeout> | null = null;

  const setStatus = (s: MqttStatus) => opts.onStatus?.(s);

  const send = (data: Uint8Array) => {
    if (ws && ws.readyState === 1) ws.send(data);
  };

  const stopPing = () => {
    if (pingTimer) clearInterval(pingTimer);
    pingTimer = null;
  };

  const scheduleReconnect = () => {
    stopPing();
    ws = null;
    if (closed) return;
    setStatus('desconectado');
    const wait = Math.min(30_000, 2_000 * 2 ** attempt);
    attempt += 1;
    retryTimer = setTimeout(open, wait);
  };

  const handle = (type: number, flags: number, body: Uint8Array) => {
    if (type === 2) {
      // CONNACK: código 0 = aceito
      if (body[1] !== 0) {
        ws?.close();
        return;
      }
      attempt = 0;
      send(subscribePacket(opts.topic));
      setStatus('conectado');
      stopPing();
      pingTimer = setInterval(() => {
        // Sem nada do broker por 1,5 × keep alive: conexão morta, reconecta.
        if (Date.now() - lastRx > keepAlive * 1500) {
          ws?.close();
          return;
        }
        send(PINGREQ);
      }, (keepAlive * 1000) / 2);
    } else if (type === 3) {
      // PUBLISH
      const tl = (body[0] << 8) | body[1];
      const topic = utf8Decode(body.subarray(2, 2 + tl));
      const qos = (flags >> 1) & 3;
      let off = 2 + tl;
      if (qos > 0) {
        send(new Uint8Array([0x40, 2, body[off], body[off + 1]])); // PUBACK
        off += 2;
      }
      try {
        opts.onMessage(topic, utf8Decode(body.subarray(off)));
      } catch {
        // erro no tratamento de uma mensagem não derruba a conexão
      }
    }
    // SUBACK (9) e PINGRESP (13) só servem para manter `lastRx` atualizado.
  };

  const onData = (chunk: Uint8Array) => {
    lastRx = Date.now();
    const merged = new Uint8Array(buf.length + chunk.length);
    merged.set(buf);
    merged.set(chunk, buf.length);
    buf = merged;
    // Um quadro do WebSocket pode trazer meio pacote MQTT ou vários juntos.
    while (buf.length >= 2) {
      let len = 0;
      let mult = 1;
      let i = 1;
      let byte: number;
      do {
        if (i >= buf.length) return;
        byte = buf[i++];
        len += (byte & 127) * mult;
        mult *= 128;
        if (mult > 128 ** 4) {
          ws?.close();
          return;
        }
      } while (byte & 128);
      if (buf.length < i + len) return;
      const head = buf[0];
      const body = buf.slice(i, i + len);
      buf = buf.slice(i + len);
      handle(head >> 4, head & 15, body);
    }
  };

  function open() {
    if (closed) return;
    setStatus('conectando');
    buf = new Uint8Array(0);
    let sock: WebSocket;
    try {
      sock = new WebSocket(opts.url, ['mqtt']);
    } catch {
      scheduleReconnect();
      return;
    }
    ws = sock;
    sock.binaryType = 'arraybuffer';
    sock.onopen = () => {
      lastRx = Date.now();
      const id = `${opts.clientIdPrefix ?? 'aquasense-app'}-${Math.random().toString(16).slice(2, 10)}`;
      sock.send(connectPacket(id, keepAlive));
    };
    sock.onmessage = (e: { data: unknown }) => {
      if (e.data instanceof ArrayBuffer) onData(new Uint8Array(e.data));
    };
    sock.onerror = () => {
      // o onclose vem logo em seguida e cuida da reconexão
    };
    sock.onclose = () => {
      if (ws === sock) scheduleReconnect();
    };
  }

  open();

  return {
    close: () => {
      closed = true;
      if (retryTimer) clearTimeout(retryTimer);
      stopPing();
      const sock = ws;
      ws = null;
      if (sock) {
        try {
          if (sock.readyState === 1) sock.send(DISCONNECT);
          sock.close();
        } catch {
          // já fechado
        }
      }
      setStatus('desconectado');
    },
  };
}

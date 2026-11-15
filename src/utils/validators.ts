import { onlyDigits } from './masks';

/** Cada validador devolve a mensagem de erro (dizendo o que corrigir) ou null se estiver certo. */
export type Validation = string | null;

export function validateName(value: string): Validation {
  return value.trim().length >= 2 ? null : 'Digite seu nome, com pelo menos 2 letras.';
}

export function validateEmail(value: string): Validation {
  const v = value.trim();
  if (!v) return 'Digite seu e-mail.';
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? null : 'Digite um e-mail válido, como nome@exemplo.com.';
}

export function validatePassword(value: string): Validation {
  return value.length >= 6 ? null : 'Use pelo menos 6 caracteres na senha.';
}

export function validatePhone(value: string): Validation {
  const d = onlyDigits(value);
  return d.length === 10 || d.length === 11 ? null : 'Digite o DDD e o número, com 10 ou 11 números.';
}

export function validateCep(value: string): Validation {
  return onlyDigits(value).length === 8 ? null : 'Digite o CEP com 8 números.';
}

export function validateHeight(value: string): Validation {
  const d = onlyDigits(value);
  if (!d || d !== value.trim()) return 'Informe a altura em centímetros, só com números.';
  const n = Number(d);
  return n >= 1 && n <= 300 ? null : 'Informe uma altura entre 1 e 300 centímetros.';
}

/** Lê "dd/mm/aaaa hh:mm". Devolve null se a data não existir. */
export function parseDateTime(value: string): Date | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2})$/.exec(value.trim());
  if (!m) return null;
  const [, dd, mm, yyyy, hh, min] = m;
  const day = Number(dd);
  const month = Number(mm);
  const year = Number(yyyy);
  const hour = Number(hh);
  const minute = Number(min);
  const date = new Date(year, month - 1, day, hour, minute, 0, 0);
  const ok =
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day &&
    date.getHours() === hour &&
    date.getMinutes() === minute;
  return ok ? date : null;
}

export function validateDateTime(value: string, now: Date = new Date()): Validation {
  const date = parseDateTime(value);
  if (!date) return 'Use o formato dd/mm/aaaa hh:mm, com uma data que exista.';
  if (date.getTime() > now.getTime() + 60_000) return 'A data e a hora não podem estar no futuro.';
  return null;
}

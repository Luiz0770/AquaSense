/** Mantém só os dígitos. */
export const onlyDigits = (value: string): string => value.replace(/\D/g, '');

/** CEP: 00000-000 */
export function maskCep(value: string): string {
  const d = onlyDigits(value).slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
}

/** Telefone: (11) 90000-0000 ou (11) 3000-0000 */
export function maskPhone(value: string): string {
  const d = onlyDigits(value).slice(0, 11);
  if (d.length === 0) return '';
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

/** Data e hora: dd/mm/aaaa hh:mm */
export function maskDateTime(value: string): string {
  const d = onlyDigits(value).slice(0, 12);
  let out = d.slice(0, 2);
  if (d.length > 2) out += `/${d.slice(2, 4)}`;
  if (d.length > 4) out += `/${d.slice(4, 8)}`;
  if (d.length > 8) out += ` ${d.slice(8, 10)}`;
  if (d.length > 10) out += `:${d.slice(10, 12)}`;
  return out;
}

/** Altura em cm: só números, até 3 dígitos. */
export function maskHeight(value: string): string {
  return onlyDigits(value).slice(0, 3);
}

/**
 * Pedido da localização atual logo após o primeiro login.
 * Só pede quando ainda não pediu e a pessoa ainda não escolheu um local por conta própria
 * (quem já escolheu um local antes mantém a escolha).
 */
export function shouldRequestLocationOnLogin(alreadyAsked: boolean, hasSavedChoice: boolean): boolean {
  return !alreadyAsked && !hasSavedChoice;
}

/** O erro de "permissão negada" do serviço de GPS (outras falhas, como GPS desligado, não contam). */
export function isPermissionDenied(error: unknown): boolean {
  return typeof error === 'object' && error !== null && (error as { code?: unknown }).code === 'permission-denied';
}

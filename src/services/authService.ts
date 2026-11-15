import * as Crypto from 'expo-crypto';
import type { Role, StoredUser, User } from '@/types';
import { getItem, setItem, removeItem, StorageKeys } from './storage';
import { makeId } from '@/utils/format';

/**
 * Autenticação LOCAL de demonstração: usuários e sessão ficam só no aparelho.
 * Não há servidor. Quando houver backend do grupo, troque as funções deste arquivo.
 */

const SALT = 'aquasense-demo';

async function hash(password: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, SALT + password);
}

export const DEMO_CITIZEN = { email: 'cidadao@exemplo.com', password: '123456' };
export const DEMO_AGENT = { email: 'agente@exemplo.com', password: '123456' };

export class AuthError extends Error {
  field: 'email' | 'password' | 'form';
  constructor(message: string, field: 'email' | 'password' | 'form' = 'form') {
    super(message);
    this.field = field;
  }
}

const toPublic = ({ passwordHash: _hash, ...user }: StoredUser): User => user;

async function loadUsers(): Promise<StoredUser[]> {
  const users = await getItem<StoredUser[]>(StorageKeys.users, []);
  if (users.length > 0) return users;
  const seed: StoredUser[] = [
    {
      id: 'u-demo-cidadao',
      name: 'Pessoa de demonstração',
      email: DEMO_CITIZEN.email,
      role: 'cidadao',
      passwordHash: await hash(DEMO_CITIZEN.password),
    },
    {
      id: 'u-demo-agente',
      name: 'Agente de demonstração',
      email: DEMO_AGENT.email,
      role: 'agente',
      passwordHash: await hash(DEMO_AGENT.password),
    },
  ];
  await setItem(StorageKeys.users, seed);
  return seed;
}

export async function restoreSession(): Promise<User | null> {
  await loadUsers(); // garante os usuários de demonstração
  return getItem<User | null>(StorageKeys.session, null);
}

export async function signIn(email: string, password: string): Promise<User> {
  const users = await loadUsers();
  const found = users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
  if (!found) throw new AuthError('Não achamos uma conta com esse e-mail. Confira ou crie uma conta.', 'email');
  if (found.passwordHash !== (await hash(password))) {
    throw new AuthError('Senha incorreta. Tente de novo.', 'password');
  }
  const user = toPublic(found);
  await setItem(StorageKeys.session, user);
  return user;
}

export interface SignUpInput {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: Role;
}

export async function signUp(input: SignUpInput): Promise<User> {
  const users = await loadUsers();
  const email = input.email.trim().toLowerCase();
  if (users.some((u) => u.email.toLowerCase() === email)) {
    throw new AuthError('Já existe uma conta com esse e-mail. Entre ou use outro e-mail.', 'email');
  }
  const stored: StoredUser = {
    id: makeId('u'),
    name: input.name.trim(),
    email,
    phone: input.phone,
    role: input.role,
    passwordHash: await hash(input.password),
  };
  await setItem(StorageKeys.users, [...users, stored]);
  const user = toPublic(stored);
  await setItem(StorageKeys.session, user);
  return user;
}

export async function signOut(): Promise<void> {
  await removeItem(StorageKeys.session);
}

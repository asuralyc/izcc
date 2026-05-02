import { reactive } from 'vue';
import type { AuthResponse, User } from '../types';
import { apiFetch, clearToken, getToken, setToken } from './api';

export const authState = reactive<{
  ready: boolean;
  user: User | null;
}>({
  ready: false,
  user: null
});

export async function hydrateAuth() {
  const token = getToken();
  if (!token) {
    authState.ready = true;
    return;
  }

  try {
    const { user } = await apiFetch<{ user: User }>('/auth/me');
    authState.user = user;
  } catch {
    clearToken();
    authState.user = null;
  } finally {
    authState.ready = true;
  }
}

export async function login(account: string, password: string) {
  const response = await apiFetch<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ account, password })
  });
  setToken(response.accessToken);
  authState.user = response.user;
  return response.user;
}

export async function register(
  email: string,
  password: string,
  displayName: string
) {
  const response = await apiFetch<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, displayName })
  });
  setToken(response.accessToken);
  authState.user = response.user;
  return response.user;
}

export function logout() {
  clearToken();
  authState.user = null;
}


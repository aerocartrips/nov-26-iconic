import apiServerClient from '@/lib/apiServerClient';

const STORAGE_KEY = '__storefront_admin__';

export function readAdminSession() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data?.email || data.password === undefined) return null;
    return { email: data.email, password: data.password };
  } catch {
    return null;
  }
}

export function writeAdminSession(email, password) {
  sessionStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ email: email.trim().toLowerCase(), password }),
  );
}

export function clearAdminSession() {
  sessionStorage.removeItem(STORAGE_KEY);
}

function basicAuthToken(email, password) {
  const raw = `${email}:${password}`;
  const bytes = new TextEncoder().encode(raw);
  let binary = '';
  bytes.forEach((b) => { binary += String.fromCharCode(b); });
  return btoa(binary);
}

export function adminAuthHeader(session) {
  if (!session) return {};
  return { Authorization: `Basic ${basicAuthToken(session.email, session.password)}` };
}

export class AdminUnauthorizedError extends Error {
  constructor() {
    super('Admin session expired.');
    this.name = 'AdminUnauthorizedError';
  }
}

/** Authenticated admin API call; returns raw Response. */
export function adminApiFetch(session, path, options = {}) {
  if (!session) {
    return Promise.reject(new Error('Not signed in.'));
  }
  return apiServerClient.fetch(path, {
    ...options,
    headers: {
      ...adminAuthHeader(session),
      ...(options.headers || {}),
    },
  });
}

/** Parses JSON from an admin API response; clears session on 401. */
export async function adminApiJson(session, path, options = {}, onUnauthorized) {
  const res = await adminApiFetch(session, path, options);
  if (res.status === 401) {
    onUnauthorized?.();
    throw new AdminUnauthorizedError();
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || res.statusText || 'Request failed.');
  }
  return data;
}

/** Validates against apps/api/.env (ADMIN_EMAIL / ADMIN_PASSWORD). */
export async function verifyAdminLogin(email, password) {
  const res = await apiServerClient.fetch('/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email.trim(), password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Invalid email or password.');
  }
  return data;
}

const BASE_URL = '/api';

function getToken() {
  return localStorage.getItem('baby-tracker-token');
}

function headers() {
  const h = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) h['Authorization'] = `Bearer ${token}`;
  return h;
}

export async function login(name, pin) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, pin }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error);
  }
  const data = await res.json();
  localStorage.setItem('baby-tracker-token', data.token);
  localStorage.setItem('baby-tracker-user', JSON.stringify(data.user));
  return data;
}

export function logout() {
  localStorage.removeItem('baby-tracker-token');
  localStorage.removeItem('baby-tracker-user');
}

export function getCurrentUser() {
  const u = localStorage.getItem('baby-tracker-user');
  return u ? JSON.parse(u) : null;
}

export function isLoggedIn() {
  return !!getToken();
}

export function isAdmin() {
  const user = getCurrentUser();
  return user && user.role === 'admin';
}

export async function getUsers() {
  const res = await fetch(`${BASE_URL}/auth/users`);
  return res.json();
}

export async function getEntries(date) {
  const res = await fetch(`${BASE_URL}/entries?date=${date}`, { headers: headers() });
  if (!res.ok) throw new Error('Failed to fetch entries');
  return res.json();
}

export async function getAllEntries() {
  const res = await fetch(`${BASE_URL}/entries/all`, { headers: headers() });
  if (!res.ok) throw new Error('Failed to fetch all entries');
  return res.json();
}

export async function getSummary(date) {
  const res = await fetch(`${BASE_URL}/entries/summary?date=${date}`, { headers: headers() });
  if (!res.ok) throw new Error('Failed to fetch summary');
  return res.json();
}

export async function createEntry(entry) {
  const res = await fetch(`${BASE_URL}/entries`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(entry),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error);
  }
  return res.json();
}

export async function updateEntry(id, entry) {
  const res = await fetch(`${BASE_URL}/entries/${id}`, {
    method: 'PUT',
    headers: headers(),
    body: JSON.stringify(entry),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error);
  }
  return res.json();
}

export async function deleteEntry(id) {
  const res = await fetch(`${BASE_URL}/entries/${id}`, {
    method: 'DELETE',
    headers: headers(),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error);
  }
  return res.json();
}

export function getExportUrl(from, to) {
  return `${BASE_URL}/entries/export?from=${from}&to=${to}`;
}

export function exportMd() {
  return fetch(`${BASE_URL}/entries/export/md`, { headers: headers() })
    .then(res => {
      if (!res.ok) throw new Error('Failed to export markdown');
      return res.blob();
    });
}

export async function getSetting(key) {
  const res = await fetch(`${BASE_URL}/settings/${key}`, { headers: headers() });
  if (!res.ok) throw new Error('Failed to fetch setting');
  return res.json();
}

export async function setSetting(key, value) {
  const res = await fetch(`${BASE_URL}/settings/${key}`, {
    method: 'PUT',
    headers: headers(),
    body: JSON.stringify({ value }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error);
  }
  return res.json();
}

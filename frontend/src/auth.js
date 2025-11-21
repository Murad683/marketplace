// src/auth.js

const AUTH_KEY = "auth";

export function saveAuth(data) {
  // data: { token, tokenType, email, type }
  localStorage.setItem(AUTH_KEY, JSON.stringify(data));
}

export function getAuth() {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

export function clearAuth() {
  localStorage.removeItem(AUTH_KEY);
}

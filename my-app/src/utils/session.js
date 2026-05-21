export function saveSession(accountId) {
  localStorage.setItem('accountId', String(accountId));
}

export function loadSession() {
  return localStorage.getItem('accountId');
}

export function clearSession() {
  localStorage.removeItem('accountId');
}

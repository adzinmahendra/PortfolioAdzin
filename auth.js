/* ════════════════════════════════════════════════════════════
   auth.js — Authentication & Session Management
   Handles: login, logout, credential storage, session check
   ════════════════════════════════════════════════════════════ */

const Auth = (() => {

  /* ── Storage Keys ──────────────────────────────────────── */
  const KEY_CREDS   = 'am_creds';
  const KEY_SESSION = 'am_session';

  /* ── Default credentials (first-time only) ─────────────── */
  const DEFAULT_CREDS = { user: 'admin', pass: 'admin123' };

  /* ── Internal state ─────────────────────────────────────── */
  let _isLoggedIn = false;

  /* ── Helpers ────────────────────────────────────────────── */
  function _getCredentials() {
    try {
      const raw = localStorage.getItem(KEY_CREDS);
      return raw ? JSON.parse(raw) : { ...DEFAULT_CREDS };
    } catch {
      return { ...DEFAULT_CREDS };
    }
  }

  function _saveCredentials(creds) {
    localStorage.setItem(KEY_CREDS, JSON.stringify(creds));
  }

  function _setSession(active) {
    _isLoggedIn = active;
    sessionStorage.setItem(KEY_SESSION, active ? '1' : '0');
  }

  /* ── Public API ─────────────────────────────────────────── */

  /**
   * Restore session across page refresh.
   * sessionStorage persists within the browser tab but clears on close.
   */
  function restoreSession() {
    const stored = sessionStorage.getItem(KEY_SESSION);
    _isLoggedIn = stored === '1';
    return _isLoggedIn;
  }

  /**
   * Attempt login with provided credentials.
   * Returns { success: bool, message: string }
   */
  function login(username, password) {
    const creds = _getCredentials();
    if (username === creds.user && password === creds.pass) {
      _setSession(true);
      return { success: true, message: 'Login berhasil!' };
    }
    return { success: false, message: 'Username atau password salah.' };
  }

  /** Log out and clear session */
  function logout() {
    _setSession(false);
  }

  /** Returns true if admin is currently logged in */
  function isLoggedIn() {
    return _isLoggedIn;
  }

  /**
   * Update credentials (username and/or password).
   * Returns { success: bool, message: string }
   */
  function updateCredentials(newUser, newPass, confirmPass) {
    if (!newUser || newUser.trim() === '') {
      return { success: false, message: 'Username tidak boleh kosong!' };
    }
    if (newPass && newPass !== confirmPass) {
      return { success: false, message: 'Password tidak cocok!' };
    }
    const creds = _getCredentials();
    creds.user = newUser.trim();
    if (newPass) creds.pass = newPass;
    _saveCredentials(creds);
    return { success: true, message: 'Kredensial berhasil disimpan!' };
  }

  /** Get current username (for display only) */
  function getUsername() {
    return _getCredentials().user;
  }

  return { restoreSession, login, logout, isLoggedIn, updateCredentials, getUsername };

})();

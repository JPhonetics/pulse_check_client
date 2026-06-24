// ─── Mock Auth Service ────────────────────────────────────────────────────────
// All state is in-memory. Replace the internals of this module with real API
// calls in Stage 2 (real auth backend). The exported function signatures stay
// the same — callers don't change.

// Seed account so the demo works out of the box
const MOCK_ACCOUNTS = [
  { email: 'demo@example.com', password: 'password', firstName: 'Demo' },
];

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * @returns {{ ok: boolean, user?: Object, error?: string }}
 */
export async function login({ email, password }) {
  await delay(400);
  const account = MOCK_ACCOUNTS.find(
    a => a.email.toLowerCase() === email.toLowerCase() && a.password === password
  );
  if (!account) {
    return { ok: false, error: 'Invalid email or password.' };
  }
  return { ok: true, user: { email: account.email, firstName: account.firstName } };
}

/**
 * @returns {{ ok: boolean, error?: string }}
 */
export async function register({ firstName, email, password }) {
  await delay(400);
  const exists = MOCK_ACCOUNTS.find(a => a.email.toLowerCase() === email.toLowerCase());
  if (exists) {
    return { ok: false, error: 'An account with that email already exists.' };
  }
  MOCK_ACCOUNTS.push({ firstName, email, password });
  return { ok: true };
}

/**
 * Always succeeds in mock mode — avoids leaking whether the email is registered.
 */
export async function requestPasswordReset({ email }) {
  await delay(400);
  return { ok: true, email };
}

/**
 * In mock mode any token except 'expired' is treated as valid.
 * @returns {{ ok: boolean, expired: boolean }}
 */
export async function validateResetToken(token) {
  await delay(200);
  if (token === 'expired') return { ok: false, expired: true };
  return { ok: true, expired: false };
}

/**
 * @returns {{ ok: boolean, error?: string }}
 */
export async function setNewPassword({ token: _token, password: _password }) {
  await delay(400);
  return { ok: true };
}

/**
 * @returns {{ ok: boolean, error?: string }}
 */
export async function updateProfile({ user, firstName, email }) {
  await delay(400);
  const account = MOCK_ACCOUNTS.find(a => a.email.toLowerCase() === user.email.toLowerCase());
  if (account) {
    account.firstName = firstName;
    account.email = email;
  }
  return { ok: true, user: { ...user, firstName, email } };
}

/**
 * @returns {{ ok: boolean, error?: string }}
 */
export async function updatePassword({ user, oldPassword, newPassword: _newPassword }) {
  await delay(400);
  const account = MOCK_ACCOUNTS.find(a => a.email.toLowerCase() === user.email.toLowerCase());
  if (!account || account.password !== oldPassword) {
    return { ok: false, error: 'Current password is incorrect.' };
  }
  account.password = _newPassword;
  return { ok: true };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

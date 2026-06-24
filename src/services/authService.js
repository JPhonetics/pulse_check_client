import { supabase } from './supabaseClient';
import { supabaseHttp } from './http';

export async function login({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { ok: false, error: 'Invalid email or password.' };
  const u = data.user;
  return { ok: true, user: { id: u.id, email: u.email, firstName: u.user_metadata?.first_name || '' } };
}

export async function register({ firstName, email, password }) {
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { first_name: firstName },
      emailRedirectTo: `${window.location.origin}/verify-email`,
    },
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function resendVerification({ email }) {
  const { error } = await supabase.auth.resend({ type: 'signup', email });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

// Always returns ok — neutral wording avoids revealing whether the email is registered.
export async function requestPasswordReset({ email }) {
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/password-reset`,
  });
  return { ok: true, email };
}

export async function setNewPassword({ password }) {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function updateProfile({ user, firstName, email }) {
  const updates = {};
  if (firstName !== user.firstName) updates.data = { first_name: firstName };
  if (email !== user.email) updates.email = email;

  const { error } = await supabase.auth.updateUser(updates);
  if (error) return { ok: false, error: error.message };

  // Keep public.user.first_name in sync (the DB trigger only runs on INSERT).
  if (firstName !== user.firstName) {
    try {
      await supabaseHttp.patch(`/user?id=eq.${user.id}`, { first_name: firstName });
    } catch {
      // Non-fatal — auth metadata is the UI source of truth.
    }
  }

  return { ok: true, emailChanged: email !== user.email };
}

export async function updatePassword({ user, oldPassword, newPassword }) {
  // Verify old password by re-authenticating before changing.
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: oldPassword,
  });
  if (signInError) return { ok: false, error: 'Current password is incorrect.' };

  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function logout() {
  await supabase.auth.signOut();
  return { ok: true };
}

export async function fetchUserProfile(userId) {
  const { data } = await supabaseHttp.get(`/user?id=eq.${userId}&select=local_city,local_state`);
  return data?.[0] || null;
}

export async function saveLocalRegionToProfile(userId, city, state) {
  await supabaseHttp.patch(`/user?id=eq.${userId}`, { local_city: city, local_state: state });
  return { ok: true };
}

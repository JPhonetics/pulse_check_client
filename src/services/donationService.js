import { supabase } from './supabaseClient';

const GUEST_TOKEN_KEY = 'pc_guest_token';

function getOrCreateGuestToken() {
  let token = localStorage.getItem(GUEST_TOKEN_KEY);
  if (!token) {
    token = crypto.randomUUID();
    localStorage.setItem(GUEST_TOKEN_KEY, token);
  }
  return token;
}

/**
 * Creates a Stripe Payment Intent via the process-donation Edge Function.
 * @param {{ amount: number, user: object|null }} opts - amount in cents
 * @returns {Promise<{ client_secret: string }>}
 */
export async function initiateDonation({ amount, user }) {
  const body = user
    ? { amount, user_id: user.id }
    : { amount, guest_token: getOrCreateGuestToken() };

  const { data, error } = await supabase.functions.invoke('process-donation', { body });
  if (error) throw error;
  return data;
}

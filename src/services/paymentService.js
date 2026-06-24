// ─── Payment Service (Stub) ───────────────────────────────────────────────────
// Stage 1: This is a stub. The donate flow opens a modal but no real payment
// is processed.
//
// Stage 3 (Payments): Replace `initiateDonation` with real Stripe Checkout.
// Example:
//   const { url } = await fetch('/api/stripe/create-checkout-session', {
//     method: 'POST',
//     body: JSON.stringify({ amount }),
//   }).then(r => r.json());
//   window.location.href = url;
//
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @param {{ amount: number }} opts - amount in cents
 * @returns {Promise<{ ok: boolean }>}
 */
export async function initiateDonation({ amount: _amount }) {
  // STAGE 3 HOOK: replace with Stripe Checkout redirect or embedded element
  return { ok: true, stub: true };
}

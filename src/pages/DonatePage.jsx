import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useAuth } from '../contexts/AuthContext';
import { initiateDonation } from '../services/donationService';
import styles from './DonatePage.module.css';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const PRESETS = [
  { label: '$5',  cents: 500  },
  { label: '$10', cents: 1000 },
  { label: '$25', cents: 2500 },
  { label: '$50', cents: 5000 },
];

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: '16px',
      fontFamily: 'Open Sans, sans-serif',
      color: '#0B1D3A',
      '::placeholder': { color: '#9ca3af' },
    },
    invalid: { color: '#C41E3A' },
  },
};

function DonateForm() {
  const stripe = useStripe();
  const elements = useElements();
  const { user } = useAuth();

  const [selectedPreset, setSelectedPreset] = useState(1000);
  const [customAmount, setCustomAmount]     = useState('');
  const [status, setStatus]                 = useState('idle');
  const [errorMsg, setErrorMsg]             = useState('');
  const [donatedAmount, setDonatedAmount]   = useState(0);

  const effectiveAmountCents = customAmount
    ? Math.round(parseFloat(customAmount) * 100)
    : selectedPreset;

  function handlePreset(cents) {
    setSelectedPreset(cents);
    setCustomAmount('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!stripe || !elements) return;

    const amountCents = effectiveAmountCents;
    if (!amountCents || amountCents <= 0) {
      setErrorMsg('Please enter a valid donation amount.');
      setStatus('error');
      return;
    }

    setStatus('loading');
    setErrorMsg('');

    try {
      const { client_secret } = await initiateDonation({ amount: amountCents, user });

      const result = await stripe.confirmCardPayment(client_secret, {
        payment_method: { card: elements.getElement(CardElement) },
      });

      if (result.error) {
        setErrorMsg(result.error.message);
        setStatus('error');
      } else {
        setDonatedAmount(amountCents);
        setStatus('success');
      }
    } catch {
      setErrorMsg('Something went wrong. Please try again.');
      setStatus('error');
    }
  }

  function handleRetry() {
    setStatus('idle');
    setErrorMsg('');
  }

  if (status === 'success') {
    const dollars = (donatedAmount / 100).toFixed(2);
    return (
      <div className={styles.success}>
        <div className={styles.successIcon}>🎉</div>
        <h2 className={styles.successTitle}>Thank you!</h2>
        <p className={styles.successMsg}>
          Your ${dollars} donation helps keep Pulse Check running.<br />
          We truly appreciate your support.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <p className={styles.amountLabel}>Choose an amount</p>

      <div className={styles.presets}>
        {PRESETS.map(({ label, cents }) => (
          <button
            key={cents}
            type="button"
            className={`${styles.presetBtn} ${selectedPreset === cents && !customAmount ? styles.active : ''}`}
            onClick={() => handlePreset(cents)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className={styles.customRow}>
        <span className={styles.currencySign}>$</span>
        <input
          className={styles.customInput}
          type="number"
          min="1"
          max="10000"
          step="1"
          placeholder="Custom amount"
          value={customAmount}
          onChange={e => { setCustomAmount(e.target.value); setSelectedPreset(null); }}
        />
      </div>

      <p className={styles.cardLabel}>Card details</p>
      <div className={styles.cardElementWrap}>
        <CardElement options={CARD_ELEMENT_OPTIONS} />
      </div>

      <button
        type="submit"
        className={styles.submitBtn}
        disabled={status === 'loading' || !stripe}
      >
        {status === 'loading' ? 'Processing…' : 'Support Pulse Check'}
      </button>

      {status === 'error' && (
        <div className={styles.error}>
          {errorMsg}
          <br />
          <button type="button" className={styles.retryBtn} onClick={handleRetry}>
            Try again
          </button>
        </div>
      )}
    </form>
  );
}

export default function DonatePage() {
  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <span className={styles.heart} aria-hidden="true">♥</span>
        <h1 className={styles.title}>Support Pulse Check</h1>
        <p className={styles.subtitle}>
          Pulse Check is free for everyone. If you find it valuable,<br />
          a small donation goes a long way toward keeping the lights on.
        </p>
        <Elements stripe={stripePromise}>
          <DonateForm />
        </Elements>
      </div>
    </div>
  );
}

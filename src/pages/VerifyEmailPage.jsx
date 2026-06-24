import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/layout/Logo';
import { useAuth } from '../contexts/AuthContext';
import styles from './VerifyEmailPage.module.css';

export default function VerifyEmailPage() {
  const navigate = useNavigate();
  const { user, authInitialized } = useAuth();

  // Once the Supabase client processes the hash and AuthContext confirms the user
  // is signed in, redirect to wherever they were before (or home).
  useEffect(() => {
    if (!authInitialized) return;
    if (user) {
      const returnTo = sessionStorage.getItem('pc_return_to') || '/';
      sessionStorage.removeItem('pc_return_to');
      navigate(returnTo, { replace: true });
    }
  }, [user, authInitialized, navigate]);

  // While the hash is being processed, show a brief loading state.
  const hasToken = window.location.hash.includes('access_token');
  if (hasToken && !authInitialized) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <p className={styles.text}>Verifying your email…</p>
        </div>
      </div>
    );
  }

  // Direct navigation (no hash) — user just registered and is waiting for the email.
  return (
    <div className={styles.page}>
      <div className={styles.logoWrap} onClick={() => navigate('/')}>
        <Logo />
      </div>
      <div className={styles.card}>
        <div className={styles.icon}>✅</div>
        <h2 className={styles.title}>Email Verified!</h2>
        <p className={styles.text}>Your email address has been confirmed. You can now log in to your Pulse Check account.</p>
        <button className={styles.btn} onClick={() => navigate('/')}>Back to Home</button>
      </div>
    </div>
  );
}

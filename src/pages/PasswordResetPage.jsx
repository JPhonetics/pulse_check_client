import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PasswordInput from '../components/ui/PasswordInput';
import Logo from '../components/layout/Logo';
import * as authService from '../services/authService';
import styles from './PasswordResetPage.module.css';

export default function PasswordResetPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('checking'); // 'checking' | 'valid' | 'expired' | 'success'
  const [form, setForm] = useState({ password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    authService.validateResetToken(token).then(result => {
      setStatus(result.expired ? 'expired' : 'valid');
    });
  }, [token]);

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = {};
    if (form.password.length < 8) errs.password = 'Password must be at least 8 characters.';
    if (form.password !== form.confirm) errs.confirm = 'Passwords do not match.';
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    await authService.setNewPassword({ token, password: form.password });
    setLoading(false);
    setStatus('success');
  }

  return (
    <div className={styles.page}>
      <div className={styles.logoWrap} onClick={() => navigate('/')}>
        <Logo />
      </div>

      <div className={styles.card}>
        {status === 'checking' && <p className={styles.muted}>Verifying link…</p>}

        {status === 'expired' && (
          <>
            <h2 className={styles.title}>Link Expired</h2>
            <p className={styles.text}>This password reset link has expired. Please request a new one.</p>
            <button className={styles.btn} onClick={() => navigate('/')}>Request New Link</button>
          </>
        )}

        {status === 'valid' && (
          <>
            <h2 className={styles.title}>Set a new password</h2>
            <p className={styles.text}>Enter and confirm your new password.</p>
            <form className={styles.form} onSubmit={handleSubmit} noValidate>
              <div className={styles.field}>
                <PasswordInput
                  placeholder="New Password"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  autoComplete="new-password"
                  required
                />
                {errors.password && <span className={styles.fieldError}>{errors.password}</span>}
              </div>
              <div className={styles.field}>
                <PasswordInput
                  placeholder="Confirm New Password"
                  value={form.confirm}
                  onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))}
                  autoComplete="new-password"
                  required
                />
                {errors.confirm && <span className={styles.fieldError}>{errors.confirm}</span>}
              </div>
              <button className={styles.btn} type="submit" disabled={loading}>
                {loading ? 'Saving…' : 'Submit'}
              </button>
            </form>
          </>
        )}

        {status === 'success' && (
          <>
            <div className={styles.successIcon}>✅</div>
            <h2 className={styles.title}>Password updated!</h2>
            <p className={styles.text}>Your password has been changed. You can now log in with your new password.</p>
            <button className={styles.btn} onClick={() => navigate('/')}>Back to Home</button>
          </>
        )}
      </div>
    </div>
  );
}

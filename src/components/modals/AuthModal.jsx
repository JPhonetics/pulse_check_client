import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../ui/Icon';
import PasswordInput from '../ui/PasswordInput';
import { useAuth } from '../../contexts/AuthContext';
import * as authService from '../../services/authService';
import styles from './AuthModal.module.css';

// screen values: 'login' | 'register' | 'forgot-password' | 'forgot-sent' | 'register-confirm'
export default function AuthModal({ onClose, initialScreen = 'login', hint }) {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [screen, setScreen] = useState(initialScreen);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [resendCooldown, setResendCooldown] = useState(false);
  const [regResendCooldown, setRegResendCooldown] = useState(false);

  // ─── Login ──────────────────────────────────────────────────────────────────
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });

  const handleLogin = useCallback(async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await login(loginForm);
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    const returnTo = sessionStorage.getItem('pc_return_to') || null;
    sessionStorage.removeItem('pc_return_to');
    onClose?.();
    if (returnTo) navigate(returnTo);
  }, [login, loginForm, onClose, navigate]);

  // ─── Register ───────────────────────────────────────────────────────────────
  const [regForm, setRegForm] = useState({ firstName: '', email: '', password: '', confirm: '', terms: false });
  const [regErrors, setRegErrors] = useState({});

  function validateReg(form) {
    const errs = {};
    if (!form.firstName.trim()) errs.firstName = 'First name is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Enter a valid email.';
    if (form.password.length < 8) errs.password = 'Password must be at least 8 characters.';
    if (form.password !== form.confirm) errs.confirm = 'Passwords do not match.';
    if (!form.terms) errs.terms = 'You must agree to the terms.';
    return errs;
  }

  const handleRegister = useCallback(async (e) => {
    e.preventDefault();
    setError('');
    const errs = validateReg(regForm);
    if (Object.keys(errs).length) { setRegErrors(errs); return; }
    setRegErrors({});
    setLoading(true);
    const result = await register({ firstName: regForm.firstName, email: regForm.email, password: regForm.password });
    setLoading(false);
    if (!result.ok) { setError(result.error); return; }
    setScreen('register-confirm');
  }, [register, regForm]);

  // ─── Forgot password ────────────────────────────────────────────────────────
  const handleForgot = useCallback(async (e) => {
    e.preventDefault();
    setError('');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotEmail)) {
      setError('Enter a valid email address.');
      return;
    }
    setLoading(true);
    await authService.requestPasswordReset({ email: forgotEmail });
    setLoading(false);
    setScreen('forgot-sent');
  }, [forgotEmail]);

  const handleResend = useCallback(async () => {
    if (resendCooldown) return;
    setResendCooldown(true);
    await authService.requestPasswordReset({ email: forgotEmail });
    setTimeout(() => setResendCooldown(false), 30000);
  }, [resendCooldown, forgotEmail]);

  const handleRegResend = useCallback(async () => {
    if (regResendCooldown) return;
    setRegResendCooldown(true);
    await authService.resendVerification({ email: regForm.email });
    setTimeout(() => setRegResendCooldown(false), 30000);
  }, [regResendCooldown, regForm.email]);

  // ─── Shared ─────────────────────────────────────────────────────────────────
  const isLogin = screen === 'login' || screen === 'forgot-password';

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">

        {/* Close button */}
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
          <Icon id="icon-close" size={20} />
        </button>

        {/* ── Tabs (visible on login/register/forgot screens) ─────────────── */}
        {(screen === 'login' || screen === 'register' || screen === 'forgot-password') && (
          <div className={styles.tabs}>
            <button
              className={`${styles.tab} ${isLogin ? styles.activeTab : ''}`}
              onClick={() => { setScreen('login'); setError(''); setRegErrors({}); }}
            >Login</button>
            <button
              className={`${styles.tab} ${screen === 'register' ? styles.activeTab : ''}`}
              onClick={() => { setScreen('register'); setError(''); setRegErrors({}); }}
            >Register</button>
          </div>
        )}

        {/* ── Login screen ────────────────────────────────────────────────── */}
        {screen === 'login' && (
          <form className={styles.form} onSubmit={handleLogin} noValidate>
            {hint && <p className={styles.hint}>{hint}</p>}
            {error && <p className={styles.error}>{error}</p>}
            <div className={styles.field}>
              <input
                className={styles.input}
                type="email"
                placeholder="Email"
                value={loginForm.email}
                onChange={e => setLoginForm(f => ({ ...f, email: e.target.value }))}
                autoComplete="email"
                required
              />
            </div>
            <div className={styles.field}>
              <PasswordInput
                placeholder="Password"
                value={loginForm.password}
                onChange={e => setLoginForm(f => ({ ...f, password: e.target.value }))}
                autoComplete="current-password"
                required
              />
            </div>
            <div className={styles.forgotRow}>
              <button type="button" className={styles.forgotLink} onClick={() => { setScreen('forgot-password'); setError(''); }}>
                Password Reset
              </button>
            </div>
            <button className={styles.submitBtn} type="submit" disabled={loading}>
              {loading ? 'Signing in…' : 'Submit'}
            </button>
          </form>
        )}

        {/* ── Register screen ─────────────────────────────────────────────── */}
        {screen === 'register' && (
          <form className={styles.form} onSubmit={handleRegister} noValidate>
            {error && <p className={styles.error}>{error}</p>}
            <div className={styles.field}>
              <input
                className={`${styles.input} ${regErrors.firstName ? styles.inputError : ''}`}
                type="text"
                placeholder="First Name"
                value={regForm.firstName}
                onChange={e => setRegForm(f => ({ ...f, firstName: e.target.value }))}
                autoComplete="given-name"
                required
              />
              {regErrors.firstName && <span className={styles.fieldError}>{regErrors.firstName}</span>}
            </div>
            <div className={styles.field}>
              <input
                className={`${styles.input} ${regErrors.email ? styles.inputError : ''}`}
                type="email"
                placeholder="Email"
                value={regForm.email}
                onChange={e => setRegForm(f => ({ ...f, email: e.target.value }))}
                autoComplete="email"
                required
              />
              {regErrors.email && <span className={styles.fieldError}>{regErrors.email}</span>}
            </div>
            <div className={styles.field}>
              <PasswordInput
                placeholder="Password"
                value={regForm.password}
                onChange={e => setRegForm(f => ({ ...f, password: e.target.value }))}
                autoComplete="new-password"
                required
              />
              {regErrors.password && <span className={styles.fieldError}>{regErrors.password}</span>}
            </div>
            <div className={styles.field}>
              <PasswordInput
                placeholder="Confirm Password"
                value={regForm.confirm}
                onChange={e => setRegForm(f => ({ ...f, confirm: e.target.value }))}
                autoComplete="new-password"
                required
              />
              {regErrors.confirm && <span className={styles.fieldError}>{regErrors.confirm}</span>}
            </div>
            <div className={styles.termsRow}>
              <label className={styles.termsLabel}>
                <input
                  type="checkbox"
                  checked={regForm.terms}
                  onChange={e => setRegForm(f => ({ ...f, terms: e.target.checked }))}
                  className={styles.checkbox}
                />
                <span>I agree to the <a href="#" className={styles.link}>terms and privacy policy</a></span>
              </label>
              {regErrors.terms && <span className={styles.fieldError}>{regErrors.terms}</span>}
            </div>
            <button className={styles.submitBtn} type="submit" disabled={loading || !regForm.terms}>
              {loading ? 'Creating account…' : 'Submit'}
            </button>
          </form>
        )}

        {/* ── Forgot password screen ──────────────────────────────────────── */}
        {screen === 'forgot-password' && (
          <form className={styles.form} onSubmit={handleForgot} noValidate>
            <p className={styles.forgotInstructions}>Enter your email and we'll send you a link to reset your password.</p>
            {error && <p className={styles.error}>{error}</p>}
            <div className={styles.field}>
              <input
                className={styles.input}
                type="email"
                placeholder="Email"
                value={forgotEmail}
                onChange={e => setForgotEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
            <button className={styles.submitBtn} type="submit" disabled={loading}>
              {loading ? 'Sending…' : 'Reset Password'}
            </button>
          </form>
        )}

        {/* ── Forgot sent confirmation ────────────────────────────────────── */}
        {screen === 'forgot-sent' && (
          <div className={styles.confirmBox}>
            <div className={styles.confirmIcon}>✉️</div>
            <h2 className={styles.confirmTitle}>Check your email</h2>
            <p className={styles.confirmText}>
              If an account exists for <strong>{forgotEmail}</strong>, we've sent a link to reset your password.
            </p>
            <p className={styles.confirmNote}>(Don't see it? Be sure to check your spam or junk folder!)</p>
            <button
              className={styles.resendBtn}
              onClick={handleResend}
              disabled={resendCooldown}
            >
              {resendCooldown ? 'Email sent — try again in 30s' : 'Resend email'}
            </button>
            <button className={styles.backLink} onClick={() => setScreen('login')}>Back to login</button>
          </div>
        )}

        {/* ── Register confirm / email verification pending ───────────────── */}
        {screen === 'register-confirm' && (
          <div className={styles.confirmBox}>
            <div className={styles.confirmIcon}>🎉</div>
            <h2 className={styles.confirmTitle}>Thank you for signing up</h2>
            <p className={styles.confirmText}>
              Please check your inbox and click the verification link to activate your account.
            </p>
            <p className={styles.confirmNote}>(Don't see it? Be sure to check your spam or junk folder!)</p>
            <button
              className={styles.resendBtn}
              onClick={handleRegResend}
              disabled={regResendCooldown}
            >
              {regResendCooldown ? 'Email sent — try again in 30s' : 'Resend verification email'}
            </button>
            <button className={styles.backLink} onClick={onClose}>Back to site</button>
          </div>
        )}

      </div>
    </div>
  );
}

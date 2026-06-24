import { useState, useCallback } from 'react';
import Icon from '../ui/Icon';
import PasswordInput from '../ui/PasswordInput';
import { useAuth } from '../../contexts/AuthContext';
import styles from './UpdateProfileModal.module.css';

export default function UpdateProfileModal({ onClose }) {
  const { user, updateProfile, updatePassword } = useAuth();
  const [tab, setTab] = useState('profile');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [profileForm, setProfileForm] = useState({
    firstName: user?.firstName || '',
    email: user?.email || '',
  });

  const [pwForm, setPwForm] = useState({ old: '', new: '', confirm: '' });
  const [pwErrors, setPwErrors] = useState({});

  const handleProfileSubmit = useCallback(async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!profileForm.firstName.trim()) { setError('First name is required.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileForm.email)) { setError('Enter a valid email.'); return; }
    setLoading(true);
    const result = await updateProfile({ firstName: profileForm.firstName, email: profileForm.email });
    setLoading(false);
    if (result.ok) setSuccess('Profile updated successfully.');
    else setError(result.error || 'Something went wrong.');
  }, [updateProfile, profileForm]);

  const handlePasswordSubmit = useCallback(async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    const errs = {};
    if (!pwForm.old) errs.old = 'Enter your current password.';
    if (pwForm.new.length < 8) errs.new = 'Password must be at least 8 characters.';
    if (pwForm.new !== pwForm.confirm) errs.confirm = 'Passwords do not match.';
    if (Object.keys(errs).length) { setPwErrors(errs); return; }
    setPwErrors({});
    setLoading(true);
    const result = await updatePassword({ oldPassword: pwForm.old, newPassword: pwForm.new });
    setLoading(false);
    if (result.ok) { setSuccess('Password updated successfully.'); setPwForm({ old: '', new: '', confirm: '' }); }
    else setError(result.error || 'Something went wrong.');
  }, [updatePassword, pwForm]);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
          <Icon id="icon-close" size={20} />
        </button>

        <div className={styles.tabs}>
          <button className={`${styles.tab} ${tab === 'profile' ? styles.activeTab : ''}`} onClick={() => { setTab('profile'); setError(''); setSuccess(''); }}>Profile</button>
          <button className={`${styles.tab} ${tab === 'password' ? styles.activeTab : ''}`} onClick={() => { setTab('password'); setError(''); setSuccess(''); }}>Password</button>
        </div>

        {error && <p className={styles.error}>{error}</p>}
        {success && <p className={styles.success}>{success}</p>}

        {tab === 'profile' && (
          <form className={styles.form} onSubmit={handleProfileSubmit} noValidate>
            <div className={styles.field}>
              <label className={styles.label}>First Name</label>
              <input
                className={styles.input}
                type="text"
                value={profileForm.firstName}
                onChange={e => setProfileForm(f => ({ ...f, firstName: e.target.value }))}
                placeholder="First Name"
                autoComplete="given-name"
                required
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Email</label>
              <input
                className={styles.input}
                type="email"
                value={profileForm.email}
                onChange={e => setProfileForm(f => ({ ...f, email: e.target.value }))}
                placeholder="Email"
                autoComplete="email"
                required
              />
            </div>
            <button className={styles.submitBtn} type="submit" disabled={loading}>
              {loading ? 'Saving…' : 'Submit'}
            </button>
          </form>
        )}

        {tab === 'password' && (
          <form className={styles.form} onSubmit={handlePasswordSubmit} noValidate>
            <div className={styles.field}>
              <label className={styles.label}>Old Password</label>
              <PasswordInput
                placeholder="Old Password"
                value={pwForm.old}
                onChange={e => setPwForm(f => ({ ...f, old: e.target.value }))}
                autoComplete="current-password"
              />
              {pwErrors.old && <span className={styles.fieldError}>{pwErrors.old}</span>}
            </div>
            <div className={styles.field}>
              <label className={styles.label}>New Password</label>
              <PasswordInput
                placeholder="New Password"
                value={pwForm.new}
                onChange={e => setPwForm(f => ({ ...f, new: e.target.value }))}
                autoComplete="new-password"
              />
              {pwErrors.new && <span className={styles.fieldError}>{pwErrors.new}</span>}
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Confirm New Password</label>
              <PasswordInput
                placeholder="Confirm New Password"
                value={pwForm.confirm}
                onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))}
                autoComplete="new-password"
              />
              {pwErrors.confirm && <span className={styles.fieldError}>{pwErrors.confirm}</span>}
            </div>
            <button className={styles.submitBtn} type="submit" disabled={loading}>
              {loading ? 'Saving…' : 'Submit'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

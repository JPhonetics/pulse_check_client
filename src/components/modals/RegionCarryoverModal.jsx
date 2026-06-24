import { useState } from 'react';
import Icon from '../ui/Icon';
import { useAuth } from '../../contexts/AuthContext';
import styles from './RegionCarryoverModal.module.css';

export default function RegionCarryoverModal() {
  const { pendingRegionCarryover, saveRegionToProfile, dismissRegionCarryover } = useAuth();
  const [loading, setLoading] = useState(false);

  const { city, state } = pendingRegionCarryover || {};

  async function handleSave() {
    setLoading(true);
    await saveRegionToProfile();
    setLoading(false);
  }

  return (
    <div className={styles.overlay} onClick={dismissRegionCarryover}>
      <div className={styles.modal} onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
        <button className={styles.closeBtn} onClick={dismissRegionCarryover} aria-label="Close">
          <Icon id="icon-close" size={20} />
        </button>

        <div className={styles.icon}>
          <Icon id="icon-location" size={28} />
        </div>

        <h2 className={styles.title}>Save your local region?</h2>
        <p className={styles.text}>
          You have <strong>{city}, {state}</strong> set as your local region on this device. Would you like to save it to your account?
        </p>

        <div className={styles.actions}>
          <button className={styles.saveBtn} onClick={handleSave} disabled={loading}>
            {loading ? 'Saving…' : 'Yes, save it'}
          </button>
          <button className={styles.skipBtn} onClick={dismissRegionCarryover}>No thanks</button>
        </div>
      </div>
    </div>
  );
}

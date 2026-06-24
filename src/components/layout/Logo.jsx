import styles from './Logo.module.css';

export default function Logo() {
  return (
    <div className={styles.lockup} aria-label="Pulse Check">
      <div className={styles.wordmark}>
        <span className={styles.pulse}>Pulse</span>
        <span className={styles.icon} aria-hidden="true">
          <svg viewBox="0 0 60 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={styles.wave}>
            <polyline points="0,12 10,12 15,3 21,21 27,8 33,16 38,12 60,12"/>
          </svg>
        </span>
        <span className={styles.check}>Check</span>
      </div>
      <p className={styles.tagline}>Your daily pulse on the world.</p>
    </div>
  );
}

import Icon from '../ui/Icon';
import styles from './DonateModal.module.css';

// STAGE 3 HOOK: Replace this stub modal with real Stripe Checkout.
// See src/services/paymentService.js for the wiring point.

const AMOUNTS = [5, 10, 25, 50];

export default function DonateModal({ onClose }) {
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
          <Icon id="icon-close" size={20} />
        </button>

        <div className={styles.heart}>
          <Icon id="icon-heart" size={40} />
        </div>

        <h2 className={styles.title}>Support Pulse Check</h2>
        <p className={styles.subtitle}>
          Help us keep the news free and independent. Every contribution matters.
        </p>

        <div className={styles.amounts}>
          {AMOUNTS.map(a => (
            <button key={a} className={styles.amountBtn} disabled>
              ${a}
            </button>
          ))}
        </div>

        <p className={styles.comingSoon}>
          Secure payments via Stripe — coming soon.
        </p>

        <button className={styles.closeTextBtn} onClick={onClose}>Maybe later</button>
      </div>
    </div>
  );
}

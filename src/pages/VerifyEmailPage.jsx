import { useNavigate } from 'react-router-dom';
import Logo from '../components/layout/Logo';
import styles from './VerifyEmailPage.module.css';

export default function VerifyEmailPage() {
  const navigate = useNavigate();
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

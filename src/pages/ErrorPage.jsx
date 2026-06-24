import { useNavigate } from 'react-router-dom';
import styles from './ErrorPage.module.css';

export default function ErrorPage() {
  const navigate = useNavigate();
  return (
    <main className={styles.main}>
      <h1 className={styles.heading}>You Know What Really<br />Grinds Our Gears?</h1>
      <h2 className={styles.subheading}>Errors!</h2>
      <p className={styles.body}>
        It appears something went wrong. We've been notified and will work diligently to resolve it.
        We apologize for the inconvenience. Please click the button to return Home.
      </p>
      <button className={styles.homeBtn} onClick={() => navigate('/')}>Home</button>
    </main>
  );
}

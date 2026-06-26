import styles from './Logo.module.css';

export default function Logo() {
  return (
    <img
      src="/logo.png"
      alt="Pulse Check — Your daily pulse on the world."
      className={styles.logoImg}
    />
  );
}

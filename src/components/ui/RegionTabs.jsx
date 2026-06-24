import styles from './RegionTabs.module.css';

const REGIONS = ['World', 'US', 'Local'];

export default function RegionTabs({ active, onChange }) {
  return (
    <nav className={styles.tabs} aria-label="Region">
      {REGIONS.map(region => (
        <button
          key={region}
          className={`${styles.tab} ${active === region ? styles.active : ''}`}
          onClick={() => onChange(region)}
          aria-current={active === region ? 'page' : undefined}
        >
          {region}
        </button>
      ))}
    </nav>
  );
}

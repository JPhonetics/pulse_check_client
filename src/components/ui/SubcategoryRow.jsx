import { SUBCATEGORIES } from './subcategories';
import styles from './SubcategoryRow.module.css';

export default function SubcategoryRow({ active, onChange }) {
  return (
    <div className={styles.row} role="group" aria-label="Sub-category">
      {SUBCATEGORIES.map(cat => (
        <button
          key={cat}
          className={`${styles.chip} ${active === cat ? styles.active : ''}`}
          onClick={() => onChange(cat)}
          aria-pressed={active === cat}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}

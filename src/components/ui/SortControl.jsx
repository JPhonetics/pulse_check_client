import Icon from './Icon';
import styles from './SortControl.module.css';

export default function SortControl({ sort, onToggle, label }) {
  const isDesc = sort === 'desc';
  return (
    <button className={styles.btn} onClick={onToggle} aria-label={`Sort ${isDesc ? 'descending' : 'ascending'}, click to toggle`}>
      {label && <span className={styles.label}>{label}</span>}
      <span className={styles.direction}>{isDesc ? 'Descending' : 'Ascending'}</span>
      <Icon id={isDesc ? 'icon-sort-desc' : 'icon-sort-asc'} size={16} />
    </button>
  );
}

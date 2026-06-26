import { useState } from 'react';
import styles from './Pagination.module.css';

export default function Pagination({ page, totalPages, onChange }) {
  const [jumpValue, setJumpValue] = useState('');

  if (totalPages <= 1) return null;

  const pages = buildPageList(page, totalPages);

  function handleJump(e) {
    if (e.key !== 'Enter') return;
    const target = parseInt(jumpValue, 10);
    if (!isNaN(target) && target >= 1 && target <= totalPages) {
      onChange(target);
      setJumpValue('');
    }
  }

  return (
    <div className={styles.wrapper}>
      <nav className={styles.nav} aria-label="Pagination">
        <button
          className={`${styles.btn} ${styles.arrow}`}
          onClick={() => onChange(page - 1)}
          disabled={page === 1}
          aria-label="Previous page"
        >
          ← Prev
        </button>

        {pages.map((p, i) =>
          p === '...' ? (
            <span key={`ellipsis-${i}`} className={styles.ellipsis}>…</span>
          ) : (
            <button
              key={p}
              className={`${styles.btn} ${p === page ? styles.active : ''}`}
              onClick={() => onChange(p)}
              aria-current={p === page ? 'page' : undefined}
              aria-label={`Page ${p}`}
            >
              {p}
            </button>
          )
        )}

        <button
          className={`${styles.btn} ${styles.arrow}`}
          onClick={() => onChange(page + 1)}
          disabled={page === totalPages}
          aria-label="Next page"
        >
          Next →
        </button>
      </nav>

      <div className={styles.jumpTo}>
        <label className={styles.jumpLabel} htmlFor="page-jump">Go to page</label>
        <input
          id="page-jump"
          className={styles.jumpInput}
          type="number"
          min={1}
          max={totalPages}
          value={jumpValue}
          onChange={e => setJumpValue(e.target.value)}
          onKeyDown={handleJump}
          aria-label="Jump to page number"
        />
      </div>
    </div>
  );
}

function buildPageList(current, total) {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  let windowStart, windowEnd;
  if (current === 1) {
    windowStart = 2;
    windowEnd = 5;
  } else if (current === total) {
    windowStart = total - 4;
    windowEnd = total - 1;
  } else {
    windowStart = current - 2;
    windowEnd = current + 3;
  }

  windowStart = Math.max(2, windowStart);
  windowEnd = Math.min(total - 1, windowEnd);

  const pages = [1];
  if (windowStart > 2) pages.push('...');
  for (let p = windowStart; p <= windowEnd; p++) pages.push(p);
  if (windowEnd < total - 1) pages.push('...');
  pages.push(total);

  return pages;
}

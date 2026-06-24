import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../components/ui/Icon';
import Pagination from '../components/articles/Pagination';
import SortControl from '../components/ui/SortControl';
import { useSaved } from '../contexts/SavedContext';
import styles from './SavedSearchesPage.module.css';

const PAGE_SIZE = 9;

function formatSaveDate(iso) {
  const d = new Date(iso);
  const year = d.getFullYear();
  const month = d.toLocaleString('en-US', { month: 'short' });
  const day = String(d.getDate()).padStart(2, '0');
  return `${year} ${month} ${day}`;
}

export default function SavedSearchesPage() {
  const navigate = useNavigate();
  const { savedSearches, unsaveSearch } = useSaved();
  const [sort, setSort] = useState('desc');
  const [page, setPage] = useState(1);

  const [prevSort, setPrevSort] = useState(sort);
  if (prevSort !== sort) {
    setPrevSort(sort);
    setPage(1);
  }

  const effectivePage = prevSort !== sort ? 1 : page;

  const sorted = useMemo(() => {
    return [...savedSearches].sort((a, b) => {
      const diff = new Date(b.savedDate) - new Date(a.savedDate);
      return sort === 'asc' ? -diff : diff;
    });
  }, [savedSearches, sort]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(effectivePage, totalPages);
  const pageItems = sorted.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const isEmpty = savedSearches.length === 0;

  return (
    <main className={styles.main}>
      <div className={styles.headingRow}>
        <h1 className={styles.heading}>Saved Searches</h1>
        {!isEmpty && (
          <SortControl sort={sort} onToggle={() => setSort(s => s === 'desc' ? 'asc' : 'desc')} />
        )}
      </div>

      {isEmpty ? (
        <p className={styles.empty}>No saved searches to display.</p>
      ) : (
        <>
          <ul className={styles.list}>
            {pageItems.map(s => (
              <li key={s.id} className={styles.card}>
                <div className={styles.cardInfo}>
                  <p className={styles.saveDate}>Save Date: {formatSaveDate(s.savedDate)}</p>
                  <p className={styles.criteria}>Criteria: {s.query}</p>
                </div>
                <div className={styles.cardActions}>
                  <button
                    className={styles.searchBtn}
                    onClick={() => navigate(`/search?q=${encodeURIComponent(s.query)}`)}
                  >
                    Search
                  </button>
                  <button
                    className={styles.unsaveBtn}
                    onClick={() => unsaveSearch(s.id)}
                    aria-label={`Unsave search for "${s.query}"`}
                  >
                    <Icon id="icon-bookmark-filled" size={20} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <Pagination page={safePage} totalPages={totalPages} onChange={setPage} />
        </>
      )}
    </main>
  );
}

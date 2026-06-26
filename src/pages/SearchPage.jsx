import { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import ArticleGrid from '../components/articles/ArticleGrid';
import Pagination from '../components/articles/Pagination';
import SortControl from '../components/ui/SortControl';
import Icon from '../components/ui/Icon';
import { searchArticles } from '../services/articlesService';
import { useAuth } from '../contexts/AuthContext';
import { useSaved } from '../contexts/SavedContext';
import styles from './SearchPage.module.css';

export default function SearchPage({ onAuthRequired }) {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const { user } = useAuth();
  const { savedArticleIds, toggleSaveArticle, isSearchSaved, saveSearch, unsaveSearch, getSavedSearchId, getGroupSaveState, saveGroup, unsaveGroup, toggleGroupSource } = useSaved();

  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sort, setSort] = useState('desc');
  const [page, setPage] = useState(1);
  const [result, setResult] = useState({ articles: [], totalPages: 1, total: 0, page: 1 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Reset page when filters change
  const [prevQuery, setPrevQuery] = useState({ query, dateFrom, dateTo, sort });
  if (prevQuery.query !== query || prevQuery.dateFrom !== dateFrom ||
      prevQuery.dateTo !== dateTo || prevQuery.sort !== sort) {
    setPrevQuery({ query, dateFrom, dateTo, sort });
    setPage(1);
  }
  const effectivePage = (prevQuery.query !== query || prevQuery.dateFrom !== dateFrom ||
    prevQuery.dateTo !== dateTo || prevQuery.sort !== sort) ? 1 : page;

  useEffect(() => {
    if (!query) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    searchArticles({ query, dateFrom: dateFrom || undefined, dateTo: dateTo || undefined, page: effectivePage, sort })
      .then(r => { if (!cancelled) { setResult(r); setLoading(false); } })
      .catch(e => { if (!cancelled) { setError(e.message || 'Search failed.'); setLoading(false); } });
    return () => { cancelled = true; };
  }, [query, dateFrom, dateTo, effectivePage, sort]);

  const saved = isSearchSaved(query);

  const handleSaveSearch = useCallback(() => {
    if (!user) {
      onAuthRequired?.('Log in to save searches.');
      return;
    }
    if (saved) {
      const id = getSavedSearchId(query);
      if (id) unsaveSearch(id);
    } else {
      saveSearch(query, dateFrom || undefined, dateTo || undefined);
    }
  }, [user, saved, query, dateFrom, dateTo, saveSearch, unsaveSearch, getSavedSearchId, onAuthRequired]);

  if (!query) {
    return (
      <main className={styles.main}>
        <p className={styles.empty}>Enter a search term above to find articles.</p>
      </main>
    );
  }

  return (
    <main className={styles.main}>
      {/* ── Heading row ─────────────────────────────────────────────── */}
      <div className={styles.headingRow}>
        <button
          className={`${styles.saveSearchBtn} ${saved ? styles.saved : ''}`}
          onClick={handleSaveSearch}
          aria-label={saved ? 'Unsave this search' : 'Save this search'}
          aria-pressed={saved}
        >
          <Icon id={saved ? 'icon-bookmark-filled' : 'icon-bookmark'} size={20} />
        </button>
        <h1 className={styles.heading}>Searching: <span>{query}</span></h1>
      </div>

      {/* ── Filters row ─────────────────────────────────────────────── */}
      <div className={styles.filtersRow}>
        <div className={styles.dateRange}>
          <label className={styles.dateLabel}>Date Range:</label>
          <input
            className={styles.dateInput}
            type="date"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
            aria-label="From date"
            max={dateTo || undefined}
          />
          <span className={styles.dateSep}>—</span>
          <input
            className={styles.dateInput}
            type="date"
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
            aria-label="To date"
            min={dateFrom || undefined}
          />
        </div>
        <SortControl sort={sort} onToggle={() => setSort(s => s === 'desc' ? 'asc' : 'desc')} />
      </div>

      {/* ── Results ─────────────────────────────────────────────────── */}
      {loading ? (
        <p className={styles.empty}>Searching…</p>
      ) : error ? (
        <p className={styles.empty} style={{ color: 'var(--accent)' }}>{error}</p>
      ) : (
        <>
          <ArticleGrid
            articles={result.articles}
            savedIds={user ? savedArticleIds : new Set()}
            onSaveToggle={a => toggleSaveArticle(a)}
            onLoginRequired={() => onAuthRequired?.('Log in to save articles.')}
            getGroupSaveState={getGroupSaveState}
            saveGroup={saveGroup}
            unsaveGroup={unsaveGroup}
            toggleGroupSource={toggleGroupSource}
            user={user}
          />
          <Pagination page={result.page} totalPages={result.totalPages} onChange={setPage} />
        </>
      )}
    </main>
  );
}

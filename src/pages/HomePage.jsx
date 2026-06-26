import { useState, useCallback, useEffect } from 'react';
import ArticleGrid from '../components/articles/ArticleGrid';
import Pagination from '../components/articles/Pagination';
import { getArticles } from '../services/articlesService';
import { useAuth } from '../contexts/AuthContext';
import { useSaved } from '../contexts/SavedContext';
import { useLocation } from '../contexts/LocationContext';
import styles from './HomePage.module.css';

export default function HomePage({ region, category, onAuthRequired }) {
  const { user } = useAuth();
  const { savedArticleIds, toggleSaveArticle, getGroupSaveState, saveGroup, unsaveGroup, toggleGroupSource } = useSaved();
  const { localRegion } = useLocation();
  const [page, setPage] = useState(() => {
    const n = parseInt(localStorage.getItem('pc_page') || '1', 10);
    return n > 0 ? n : 1;
  });

  useEffect(() => {
    localStorage.setItem('pc_page', String(page));
  }, [page]);

  const [result, setResult] = useState({ articles: [], totalPages: 1, total: 0, page: 1, localBanner: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Reset to page 1 when filters change
  const [prevFilters, setPrevFilters] = useState({ region, category, localRegion });
  if (prevFilters.region !== region || prevFilters.category !== category || prevFilters.localRegion !== localRegion) {
    setPrevFilters({ region, category, localRegion });
    setPage(1);
  }
  const effectivePage = (
    prevFilters.region !== region ||
    prevFilters.category !== category ||
    prevFilters.localRegion !== localRegion
  ) ? 1 : page;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getArticles({ region, category, page: effectivePage, localRegion })
      .then(r => { if (!cancelled) { setResult(r); setLoading(false); } })
      .catch(e => { if (!cancelled) { setError(e.message || 'Failed to load articles.'); setLoading(false); } });
    return () => { cancelled = true; };
  }, [region, category, effectivePage, localRegion]);

  const handleSaveToggle = useCallback((article) => {
    toggleSaveArticle(article);
  }, [toggleSaveArticle]);

  const heading = buildHeading(region, category);

  return (
    <main className={styles.main}>
      <h1 className={styles.heading}>{heading}</h1>
      {result.localBanner && (
        <p className={styles.localBanner}>
          Limited results for {result.localBanner.city} — showing {result.localBanner.state} news
        </p>
      )}
      {loading ? (
        <p className={styles.status}>Loading articles…</p>
      ) : error ? (
        <p className={styles.statusError}>{error}</p>
      ) : (
        <>
          <ArticleGrid
            articles={result.articles}
            savedIds={user ? savedArticleIds : new Set()}
            onSaveToggle={handleSaveToggle}
            onLoginRequired={() => onAuthRequired?.()}
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

function buildHeading(region, category) {
  if (category === 'All') {
    if (region === 'World') return 'Latest Headlines';
    return `${region} Headlines`;
  }
  return `${region} — ${category}`;
}

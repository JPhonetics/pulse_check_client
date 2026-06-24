import { useState, useMemo, useCallback } from 'react'; // useState used for page + prevFilters
import ArticleGrid from '../components/articles/ArticleGrid';
import Pagination from '../components/articles/Pagination';
import { getArticles } from '../services/articlesService';
import { useAuth } from '../contexts/AuthContext';
import { useSaved } from '../contexts/SavedContext';
import styles from './HomePage.module.css';

export default function HomePage({ region, category, onAuthRequired }) {
  const { user } = useAuth();
  const { savedArticleIds, toggleSaveArticle } = useSaved();
  const [page, setPage] = useState(1);

  // Adjust page to 1 when filters change (React's recommended render-time state adjustment)
  const [prevFilters, setPrevFilters] = useState({ region, category });
  if (prevFilters.region !== region || prevFilters.category !== category) {
    setPrevFilters({ region, category });
    setPage(1);
  }

  // getArticles is synchronous (local JSON) — useMemo is correct here, no effect needed
  const effectivePage = (prevFilters.region !== region || prevFilters.category !== category) ? 1 : page;
  const result = useMemo(
    () => getArticles({ region, category, page: effectivePage }),
    [region, category, effectivePage]
  );

  const handleSaveToggle = useCallback((article) => {
    toggleSaveArticle(article.id);
  }, [toggleSaveArticle]);

  const heading = buildHeading(region, category);

  return (
    <main className={styles.main}>
      <h1 className={styles.heading}>{heading}</h1>
      <ArticleGrid
        articles={result.articles}
        savedIds={user ? savedArticleIds : new Set()}
        onSaveToggle={handleSaveToggle}
        onLoginRequired={() => onAuthRequired?.()}
      />
      <Pagination page={result.page} totalPages={result.totalPages} onChange={setPage} />
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

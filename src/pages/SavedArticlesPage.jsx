import { useState, useMemo } from 'react';
import ArticleGrid from '../components/articles/ArticleGrid';
import Pagination from '../components/articles/Pagination';
import SortControl from '../components/ui/SortControl';
import { getArticlesByIds } from '../services/articlesService';
import { useSaved } from '../contexts/SavedContext';
import styles from './SavedArticlesPage.module.css';

export default function SavedArticlesPage() {
  const { savedArticleIds, toggleSaveArticle } = useSaved();
  const [sort, setSort] = useState('desc');
  const [page, setPage] = useState(1);

  const [prevSort, setPrevSort] = useState(sort);
  if (prevSort !== sort) {
    setPrevSort(sort);
    setPage(1);
  }

  const effectivePage = prevSort !== sort ? 1 : page;
  const ids = useMemo(() => [...savedArticleIds], [savedArticleIds]);

  const result = useMemo(
    () => getArticlesByIds({ ids, sort, page: effectivePage }),
    [ids, sort, effectivePage]
  );

  const isEmpty = savedArticleIds.size === 0;

  return (
    <main className={styles.main}>
      <div className={styles.headingRow}>
        <h1 className={styles.heading}>Saved Articles</h1>
        {!isEmpty && (
          <SortControl sort={sort} onToggle={() => setSort(s => s === 'desc' ? 'asc' : 'desc')} />
        )}
      </div>

      {isEmpty ? (
        <p className={styles.empty}>No saved articles to display.</p>
      ) : (
        <>
          <ArticleGrid
            articles={result.articles}
            savedIds={savedArticleIds}
            onSaveToggle={a => toggleSaveArticle(a.id)}
          />
          <Pagination page={result.page} totalPages={result.totalPages} onChange={setPage} />
        </>
      )}
    </main>
  );
}

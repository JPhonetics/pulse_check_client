import { useState, useMemo } from 'react';
import ArticleGrid from '../components/articles/ArticleGrid';
import Pagination from '../components/articles/Pagination';
import SortControl from '../components/ui/SortControl';
import { useSaved } from '../contexts/SavedContext';
import styles from './SavedArticlesPage.module.css';

const PAGE_SIZE = 9;

export default function SavedArticlesPage() {
  const { savedArticles, savedArticleIds, toggleSaveArticle } = useSaved();
  const [sort, setSort] = useState('desc');
  const [page, setPage] = useState(1);

  const [prevSort, setPrevSort] = useState(sort);
  if (prevSort !== sort) {
    setPrevSort(sort);
    setPage(1);
  }
  const effectivePage = prevSort !== sort ? 1 : page;

  const sorted = useMemo(() => {
    return [...savedArticles].sort((a, b) => {
      const diff = new Date(b.publishDate) - new Date(a.publishDate);
      return sort === 'asc' ? -diff : diff;
    });
  }, [savedArticles, sort]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(effectivePage, totalPages);
  const pageArticles = sorted.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const isEmpty = savedArticles.length === 0;

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
            articles={pageArticles}
            savedIds={savedArticleIds}
            onSaveToggle={a => toggleSaveArticle(a)}
          />
          <Pagination page={safePage} totalPages={totalPages} onChange={setPage} />
        </>
      )}
    </main>
  );
}

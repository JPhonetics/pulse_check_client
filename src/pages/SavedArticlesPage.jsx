import { useState, useMemo } from 'react';
import ArticleGrid from '../components/articles/ArticleGrid';
import Pagination from '../components/articles/Pagination';
import SortControl from '../components/ui/SortControl';
import { useSaved } from '../contexts/SavedContext';
import { useAuth } from '../contexts/AuthContext';
import styles from './SavedArticlesPage.module.css';

const PAGE_SIZE = 9;

export default function SavedArticlesPage() {
  const { savedArticles, savedArticleIds, toggleSaveArticle, getGroupSaveState, saveGroup, unsaveGroup, toggleGroupSource } = useSaved();
  const { user } = useAuth();
  const [sort, setSort] = useState('desc');
  const [page, setPage] = useState(1);

  const [prevSort, setPrevSort] = useState(sort);
  if (prevSort !== sort) {
    setPrevSort(sort);
    setPage(1);
  }
  const effectivePage = prevSort !== sort ? 1 : page;

  const groupedArticles = useMemo(() => {
    const map = new Map();
    for (const a of savedArticles) {
      const key = a.groupKey ?? a.id;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(a);
    }
    return Array.from(map.values()).map(members => ({
      ...members[0],
      sources: members.map(m => ({
        id: m.id, source: m.source, url: m.url,
        imageUrl: m.imageUrl || '', publishDate: m.publishDate, title: m.title,
        groupKey: m.groupKey ?? m.id,
      })),
      sourceCount: members.length,
      groupKey: members[0].groupKey ?? members[0].id,
    }));
  }, [savedArticles]);

  const sorted = useMemo(() => {
    return [...groupedArticles].sort((a, b) => {
      const diff = new Date(b.publishDate) - new Date(a.publishDate);
      return sort === 'asc' ? -diff : diff;
    });
  }, [groupedArticles, sort]);

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
            getGroupSaveState={getGroupSaveState}
            saveGroup={saveGroup}
            unsaveGroup={unsaveGroup}
            toggleGroupSource={toggleGroupSource}
            user={user}
          />
          <Pagination page={safePage} totalPages={totalPages} onChange={setPage} />
        </>
      )}
    </main>
  );
}

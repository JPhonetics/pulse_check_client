import { useState, useRef, useEffect } from 'react';
import ArticleCard from './ArticleCard';
import SourcePickerPopover from './SourcePickerPopover';
import styles from './ArticleGrid.module.css';

export default function ArticleGrid({
  articles,
  savedIds = new Set(),
  onSaveToggle,
  onLoginRequired,
  getGroupSaveState,
  saveGroup,
  unsaveGroup,
  toggleGroupSource,
  user,
}) {
  const [activeArticle, setActiveArticle] = useState(null);
  const activeWrapperRef = useRef(null);

  useEffect(() => {
    if (!activeArticle) return;
    function handleMouseDown(e) {
      if (activeWrapperRef.current && !activeWrapperRef.current.contains(e.target)) {
        setActiveArticle(null);
      }
    }
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [activeArticle]);

  if (!articles || articles.length === 0) {
    return (
      <div className={styles.empty}>
        <p>There are no articles matching this criteria. Please try widening your search.</p>
      </div>
    );
  }

  function handleOpenPicker(article) {
    setActiveArticle(prev => prev?.id === article.id ? null : article);
  }

  function getSourceIds(article) {
    return (article.sources || [{ id: article.id }]).map(s => s.id);
  }

  function getArticleGroupKey(article) {
    return article.groupKey ?? article.id;
  }

  function computeSaveState(article) {
    if (!getGroupSaveState) {
      return savedIds.has(article.id) ? 'all' : 'none';
    }
    const sourceIds = getSourceIds(article);
    return getGroupSaveState(getArticleGroupKey(article), sourceIds);
  }

  function handleSaveToggle(article) {
    if (!user) { onLoginRequired?.('Log in to save articles.'); return; }
    if (!saveGroup || !unsaveGroup) {
      onSaveToggle?.(article);
      return;
    }
    const sourceIds = getSourceIds(article);
    const state = getGroupSaveState
      ? getGroupSaveState(getArticleGroupKey(article), sourceIds)
      : (savedIds.has(article.id) ? 'all' : 'none');
    if (state === 'all') {
      unsaveGroup(sourceIds);
    } else {
      const sourcesWithKey = (article.sources || [{
        id: article.id, source: article.source, url: article.url,
        imageUrl: article.imageUrl, publishDate: article.publishDate, title: article.title,
      }]).map(s => ({ ...s, groupKey: getArticleGroupKey(article) }));
      saveGroup(sourcesWithKey);
    }
  }

  return (
    <div className={styles.grid}>
      {articles.map(article => (
        <div
          key={article.id}
          ref={activeArticle?.id === article.id ? activeWrapperRef : null}
          className={`${styles.cardWrapper} ${activeArticle?.id === article.id ? styles.cardWrapperActive : ''}`}
        >
          <ArticleCard
            article={article}
            saveState={computeSaveState(article)}
            onSaveToggle={handleSaveToggle}
            onLoginRequired={onLoginRequired}
            onOpenPicker={handleOpenPicker}
          />
          {activeArticle?.id === article.id && (
            <SourcePickerPopover
              article={activeArticle}
              savedArticleIds={savedIds}
              onToggleSource={(src) => {
                if (toggleGroupSource) {
                  toggleGroupSource(src, getArticleGroupKey(activeArticle));
                }
              }}
              onLoginRequired={onLoginRequired}
              onClose={() => setActiveArticle(null)}
              user={user}
            />
          )}
        </div>
      ))}
    </div>
  );
}

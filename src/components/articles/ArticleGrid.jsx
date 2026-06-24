import ArticleCard from './ArticleCard';
import styles from './ArticleGrid.module.css';

export default function ArticleGrid({ articles, savedIds = new Set(), onSaveToggle, onLoginRequired }) {
  if (!articles || articles.length === 0) {
    return (
      <div className={styles.empty}>
        <p>There are no articles matching this criteria. Please try widening your search.</p>
      </div>
    );
  }

  return (
    <div className={styles.grid}>
      {articles.map(article => (
        <ArticleCard
          key={article.id}
          article={article}
          isSaved={savedIds.has(article.id)}
          onSaveToggle={onSaveToggle}
          onLoginRequired={onLoginRequired}
        />
      ))}
    </div>
  );
}

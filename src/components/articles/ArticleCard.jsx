import { useCallback } from 'react';
import Icon from '../ui/Icon';
import { useAuth } from '../../contexts/AuthContext';
import styles from './ArticleCard.module.css';

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function ArticleCard({ article, isSaved = false, onSaveToggle, onLoginRequired }) {
  const { user } = useAuth();

  const handleBookmark = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (user) {
      onSaveToggle?.(article);
    } else {
      onLoginRequired?.('Log in to save articles.');
    }
  }, [user, article, onSaveToggle, onLoginRequired]);

  const handleCardClick = useCallback(() => {
    window.open(article.url, '_blank', 'noopener,noreferrer');
  }, [article.url]);

  return (
    <article className={styles.card} onClick={handleCardClick} role="link" tabIndex={0}
      onKeyDown={e => { if (e.key === 'Enter') handleCardClick(); }}
      aria-label={article.title}
    >
      <div className={styles.imageWrap}>
        <img
          src={article.imageUrl}
          alt=""
          className={styles.image}
          loading="lazy"
          onError={e => { e.target.style.display = 'none'; }}
        />
      </div>

      <div className={styles.body}>
        <div className={styles.meta}>
          <span className={styles.category}>{article.category}</span>
          <button
            className={`${styles.bookmark} ${isSaved ? styles.saved : ''}`}
            onClick={handleBookmark}
            aria-label={isSaved ? 'Unsave article' : 'Save article'}
            aria-pressed={isSaved}
          >
            <Icon id={isSaved ? 'icon-bookmark-filled' : 'icon-bookmark'} size={18} />
          </button>
        </div>

        <h3 className={styles.title}>{article.title}</h3>
        <p className={styles.snippet}>{article.snippet}</p>

        <div className={styles.footer}>
          <span className={styles.source}>{article.source}</span>
          <span className={styles.date}>{formatDate(article.publishDate)}</span>
        </div>
      </div>
    </article>
  );
}

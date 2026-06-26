import { useCallback } from 'react';
import Icon from '../ui/Icon';
import { useAuth } from '../../contexts/AuthContext';
import styles from './ArticleCard.module.css';

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function ArticleCard({ article, saveState = 'none', onSaveToggle, onLoginRequired, onOpenPicker }) {
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
    if (article.sourceCount > 1) {
      onOpenPicker?.(article);
    } else {
      window.open(article.url, '_blank', 'noopener,noreferrer');
    }
  }, [article, onOpenPicker]);

  const bookmarkClass = [
    styles.bookmark,
    saveState === 'all' ? styles.saved : '',
    saveState === 'some' ? styles.bookmarkPartial : '',
  ].filter(Boolean).join(' ');

  const bookmarkIcon = saveState === 'all' ? 'icon-bookmark-filled' : 'icon-bookmark';

  const bookmarkLabel =
    saveState === 'all' ? 'Unsave article' :
    saveState === 'some' ? 'Save all sources' :
    'Save article';

  return (
    <article className={styles.card} onClick={handleCardClick} role="link" tabIndex={0}
      onKeyDown={e => { if (e.key === 'Enter') handleCardClick(); }}
      aria-label={article.title}
    >
      <div className={`${styles.imageWrap} ${!article.imageUrl ? styles.imageWrapPlaceholder : ''}`}>
        <img
          src={article.imageUrl || '/logo_outline.png'}
          alt=""
          className={article.imageUrl ? styles.image : styles.imagePlaceholder}
          loading="lazy"
          onError={e => {
            e.target.src = '/logo_outline.png';
            e.target.className = styles.imagePlaceholder;
            e.target.parentElement.classList.add(styles.imageWrapPlaceholder);
          }}
        />
      </div>

      <div className={styles.body}>
        <div className={styles.meta}>
          <span className={styles.category}>{article.category}</span>
          <button
            className={bookmarkClass}
            onClick={handleBookmark}
            aria-label={bookmarkLabel}
            aria-pressed={saveState === 'all'}
          >
            <Icon id={bookmarkIcon} size={18} />
          </button>
        </div>

        <h3 className={styles.title}>{article.title}</h3>
        <p className={styles.snippet}>{article.snippet}</p>

        <div className={styles.footer}>
          {article.sourceCount > 1
            ? <span className={styles.badge}>{article.sourceCount} sources</span>
            : <span className={styles.source}>{article.source}</span>
          }
          <span className={styles.date}>{formatDate(article.publishDate)}</span>
        </div>
      </div>
    </article>
  );
}

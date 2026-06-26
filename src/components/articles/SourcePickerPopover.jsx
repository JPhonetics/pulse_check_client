import { useEffect, useRef } from 'react';
import Icon from '../ui/Icon';
import styles from './SourcePickerPopover.module.css';

function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function SourcePickerPopover({
  article,
  savedArticleIds,
  onToggleSource,
  onLoginRequired,
  onClose,
  user,
}) {
  const popoverRef = useRef(null);

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    popoverRef.current?.focus();
  }, []);


  function handleBookmark(e, src) {
    e.stopPropagation();
    if (!user) { onLoginRequired?.('Log in to save articles.'); return; }
    onToggleSource(src);
  }

  function openSource(src) {
    window.open(src.url, '_blank', 'noopener,noreferrer');
  }

  return (
    <>
      <div
        ref={popoverRef}
        className={styles.popover}
        role="dialog"
        aria-modal="true"
        aria-label={`Sources for "${article.title}"`}
        tabIndex={-1}
      >
        <ul className={styles.sourceList} role="list">
          {(article.sources || []).map(src => {
            const saved = savedArticleIds.has(src.id);
            return (
              <li
                key={src.id}
                className={styles.sourceRow}
                onClick={() => openSource(src)}
                role="button"
                tabIndex={0}
                onKeyDown={e => { if (e.key === 'Enter') openSource(src); }}
                aria-label={`Open ${src.source} in new tab`}
              >
                <button
                  className={`${styles.srcBookmark} ${saved ? styles.saved : ''}`}
                  onClick={(e) => handleBookmark(e, src)}
                  aria-label={saved ? `Unsave ${src.source}` : `Save ${src.source}`}
                  aria-pressed={saved}
                >
                  <Icon id={saved ? 'icon-bookmark-filled' : 'icon-bookmark'} size={15} />
                </button>
                <span className={styles.srcName}>{src.source}</span>
                <span className={styles.srcLink}>↗</span>
              </li>
            );
          })}
        </ul>
      </div>
    </>
  );
}

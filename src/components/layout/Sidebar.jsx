import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../ui/Icon';
import { useAuth } from '../../contexts/AuthContext';
import styles from './Sidebar.module.css';

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  function nav(path) {
    navigate(path);
    onClose();
  }

  return (
    <>
      {isOpen && <div className={styles.scrim} onClick={onClose} aria-hidden="true" />}
      <aside className={`${styles.sidebar} ${isOpen ? styles.open : ''}`} aria-label="Site navigation">
        <div className={styles.sidebarHeader}>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close menu">
            <Icon id="icon-close" size={22} />
          </button>
        </div>

        <nav className={styles.nav}>
          <button className={styles.item} onClick={() => nav('/about')}>About Us</button>
          {user && (
            <>
              <button className={styles.item} onClick={() => nav('/saved-articles')}>Saved Articles</button>
              <button className={styles.item} onClick={() => nav('/saved-searches')}>Saved Searches</button>
            </>
          )}
        </nav>

        {user && (
          <div className={styles.footer}>
            <button className={`${styles.item} ${styles.logout}`} onClick={() => { logout(); nav('/'); }}>
              Logout
            </button>
          </div>
        )}
      </aside>
    </>
  );
}

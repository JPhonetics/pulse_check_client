import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useLocation as useRouterLocation, useSearchParams, Link } from 'react-router-dom';
import Icon from '../ui/Icon';
import Logo from './Logo';
import RegionTabs from '../ui/RegionTabs';
import SubcategoryRow from '../ui/SubcategoryRow';
import { useAuth } from '../../contexts/AuthContext';
import { useLocation } from '../../contexts/LocationContext';
import styles from './Header.module.css';

function formatHeaderDate() {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
  });
}

export default function Header({
  region, onRegionChange,
  category, onCategoryChange,
  onMenuToggle,
  onAuthRequired,
  onLocationEdit,
}) {
  const { user, logout } = useAuth();
  const { localRegion } = useLocation();
  const navigate = useNavigate();
  const routerLocation = useRouterLocation();
  const [searchValue, setSearchValue] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const isOnSearch = routerLocation.pathname === '/search';
  const [searchParams] = useSearchParams();

  // Sync search box with URL when on /search
  const [prevIsOnSearch, setPrevIsOnSearch] = useState(isOnSearch);
  if (prevIsOnSearch !== isOnSearch) {
    setPrevIsOnSearch(isOnSearch);
    setSearchValue(isOnSearch ? (searchParams.get('q') || '') : '');
  }

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSearch = useCallback((e) => {
    e.preventDefault();
    const q = searchValue.trim();
    if (!q) return;
    navigate(`/search?q=${encodeURIComponent(q)}`);
  }, [searchValue, navigate]);

  const isOnHome = routerLocation.pathname === '/';

  const handleRegionChange = useCallback((newRegion) => {
    if (newRegion === 'Local' && !localRegion) {
      onLocationEdit?.();
      return;
    }
    if (!isOnHome) navigate('/');
    onRegionChange(newRegion);
  }, [localRegion, isOnHome, navigate, onRegionChange, onLocationEdit]);

  const handleUserIconClick = useCallback(() => {
    if (user) {
      setDropdownOpen(v => !v);
    } else {
      onAuthRequired?.();
    }
  }, [user, onAuthRequired]);

  return (
    <header className={styles.header}>
      {/* ── Top bar ─────────────────────────────────────────────────── */}
      <div className={styles.topBar}>
        <div className={styles.topLeft}>
          <button className={styles.menuBtn} onClick={onMenuToggle} aria-label="Open menu">
            <Icon id="icon-menu" size={22} />
          </button>
          <span className={styles.date}>{formatHeaderDate()}</span>
        </div>

        <div className={styles.topCenter}>
          <button className={styles.locationBtn} onClick={onLocationEdit} aria-label="Set local region">
            <Icon id="icon-location" size={14} />
            <span>{localRegion || 'Set Location'}</span>
            <Icon id="icon-edit" size={13} />
          </button>
        </div>

        <div className={styles.topRight}>
          <Link to="/donate" className={styles.donateBtn}>
            <Icon id="icon-heart" size={14} />
            Donate
          </Link>
          <div className={styles.userWrap} ref={dropdownRef}>
            <button
              className={`${styles.userBtn} ${user ? styles.loggedIn : ''}`}
              onClick={handleUserIconClick}
              aria-label={user ? `Account menu for ${user.firstName}` : 'Log in or register'}
              aria-expanded={dropdownOpen}
            >
              <Icon id={user ? 'icon-user-filled' : 'icon-user'} size={22} />
            </button>
            {dropdownOpen && user && (
              <div className={styles.dropdown}>
                <div className={styles.dropdownUser}>
                  <strong>{user.firstName}</strong>
                  <small>{user.email}</small>
                </div>
                <button className={styles.dropdownItem} onClick={() => { setDropdownOpen(false); onAuthRequired?.('profile'); }}>
                  Update Profile
                </button>
                <button className={styles.dropdownItem} onClick={() => { setDropdownOpen(false); logout(); navigate('/'); }}>
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Logo ──────────────────────────────────────────────────────── */}
      <div className={styles.logoRow} onClick={() => { navigate('/'); onRegionChange('World'); onCategoryChange('All'); }}>
        <Logo />
      </div>

      {/* ── Nav row: region tabs + search ──────────────────────────── */}
      <div className={styles.navRow}>
        <RegionTabs active={region} onChange={handleRegionChange} />
        <form className={styles.searchForm} onSubmit={handleSearch} role="search">
          <Icon id="icon-search" size={16} className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            type="search"
            placeholder="search"
            value={searchValue}
            onChange={e => setSearchValue(e.target.value)}
            aria-label="Search articles"
          />
        </form>
      </div>

      {/* ── Sub-category row ─────────────────────────────────────────── */}
      <SubcategoryRow active={category} onChange={(cat) => { if (!isOnHome) navigate('/'); onCategoryChange(cat); }} />
    </header>
  );
}

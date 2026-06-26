import { useState, useCallback } from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import AuthModal from './components/modals/AuthModal';
import LocalRegionModal from './components/modals/LocalRegionModal';
import UpdateProfileModal from './components/modals/UpdateProfileModal';
import RegionCarryoverModal from './components/modals/RegionCarryoverModal';
import HomePage from './pages/HomePage';
import SearchPage from './pages/SearchPage';
import SavedArticlesPage from './pages/SavedArticlesPage';
import SavedSearchesPage from './pages/SavedSearchesPage';
import ErrorPage from './pages/ErrorPage';
import PasswordResetPage from './pages/PasswordResetPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import DonatePage from './pages/DonatePage';
import ProtectedRoute from './router/ProtectedRoute';
import { useAuth } from './contexts/AuthContext';

function AboutPage() {
  return (
    <main style={{ flex: 1, padding: '48px 24px', maxWidth: 640, margin: '0 auto' }}>
      <h1 style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-navy)', fontSize: '2rem', fontWeight: 800, marginBottom: 16 }}>About Us</h1>
      <p style={{ lineHeight: 1.7, color: 'var(--text)', marginBottom: 12 }}>
        Pulse Check is your daily pulse on the world — a curated news aggregator bringing you top headlines from around the globe, across the United States, and in your local community.
      </p>
      <p style={{ lineHeight: 1.7, color: 'var(--text)' }}>
        Browse by region and topic, save articles and searches, and stay informed with a clean, distraction-free reading experience.
      </p>
    </main>
  );
}

// modal names: null | 'auth' | 'location' | 'profile'
export default function App() {
  const { user, pendingRegionCarryover } = useAuth();
  const [region, setRegion] = useState(() => localStorage.getItem('pc_region') || 'World');
  const [category, setCategory] = useState(() => localStorage.getItem('pc_category') || 'All');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [modal, setModal] = useState(null);
  const [authHint, setAuthHint] = useState('');
  const [authInitScreen, setAuthInitScreen] = useState('login');

  const closeModal = useCallback(() => { setModal(null); setAuthHint(''); }, []);

  const handleRegionChange = useCallback((r) => {
    setRegion(r);
    setCategory('All');
    localStorage.setItem('pc_region', r);
    localStorage.setItem('pc_category', 'All');
  }, []);

  const handleCategoryChange = useCallback((c) => {
    setCategory(c);
    localStorage.setItem('pc_category', c);
  }, []);

  const handleAuthRequired = useCallback((context) => {
    if (context === 'profile') {
      setModal('profile');
    } else {
      // Store the current path so we can return the user here after login.
      sessionStorage.setItem('pc_return_to', window.location.pathname);
      setAuthHint(typeof context === 'string' && context !== 'profile' ? context : '');
      setAuthInitScreen('login');
      setModal('auth');
    }
  }, []);

  return (
    <>
      <Header
        region={region}
        onRegionChange={handleRegionChange}
        category={category}
        onCategoryChange={handleCategoryChange}
        onMenuToggle={() => setSidebarOpen(true)}
        onAuthRequired={handleAuthRequired}
        onLocationEdit={() => setModal('location')}
      />

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <Routes>
        <Route
          path="/"
          element={
            <HomePage
              region={region}
              category={category}
              onAuthRequired={() => { setAuthHint('Log in to save articles.'); setModal('auth'); }}
            />
          }
        />
        <Route
          path="/search"
          element={
            <SearchPage
              onAuthRequired={(hint) => { setAuthHint(hint || ''); setModal('auth'); }}
            />
          }
        />
        <Route path="/saved-articles" element={<ProtectedRoute><SavedArticlesPage /></ProtectedRoute>} />
        <Route path="/saved-searches" element={<ProtectedRoute><SavedSearchesPage /></ProtectedRoute>} />
        <Route path="/password-reset" element={<PasswordResetPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/donate" element={<DonatePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="*" element={<ErrorPage />} />
      </Routes>

      {modal === 'auth' && !user && (
        <AuthModal
          onClose={closeModal}
          initialScreen={authInitScreen}
          hint={authHint}
        />
      )}
      {modal === 'location' && (
        <LocalRegionModal onClose={closeModal} />
      )}
      {modal === 'profile' && user && (
        <UpdateProfileModal onClose={closeModal} />
      )}
      {pendingRegionCarryover && (
        <RegionCarryoverModal />
      )}
    </>
  );
}

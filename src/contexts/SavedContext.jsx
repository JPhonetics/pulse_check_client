import { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import * as savedArticleService from '../services/savedArticleService';
import * as savedSearchService from '../services/savedSearchService';

// Auth is deferred — use the placeholder test user for all saved-content operations.
// Replace with useAuth().user?.id when real auth is wired.
const TEST_USER_ID = import.meta.env.VITE_TEST_USER_ID;

const SavedContext = createContext(null);

export function SavedProvider({ children }) {
  const [savedArticles, setSavedArticles] = useState([]);
  const [savedSearches, setSavedSearches] = useState([]);

  // Derive the id Set from savedArticles so there's one source of truth
  const savedArticleIds = useMemo(
    () => new Set(savedArticles.map(a => a.id)),
    [savedArticles]
  );

  useEffect(() => {
    if (!TEST_USER_ID) return;
    savedArticleService.getSavedArticles(TEST_USER_ID)
      .then(setSavedArticles)
      .catch(err => console.error('[SavedContext] Failed to load saved articles:', err.message));
  }, []);

  useEffect(() => {
    if (!TEST_USER_ID) return;
    savedSearchService.getSavedSearches(TEST_USER_ID)
      .then(setSavedSearches)
      .catch(err => console.error('[SavedContext] Failed to load saved searches:', err.message));
  }, []);

  // Accepts the full article object so a snapshot can be written to saved_article.
  const toggleSaveArticle = useCallback(async (article) => {
    const id = article.id;
    if (savedArticleIds.has(id)) {
      // Optimistic remove
      setSavedArticles(prev => prev.filter(a => a.id !== id));
      try {
        await savedArticleService.unsaveArticle(TEST_USER_ID, id);
      } catch (err) {
        console.error('[SavedContext] unsaveArticle failed:', err.message);
        // Rollback: re-add at front
        setSavedArticles(prev => {
          const rollback = { ...article, region: 'Saved', category: 'All', snippet: article.snippet || '', imageUrl: article.imageUrl || '' };
          return [rollback, ...prev];
        });
      }
    } else {
      // Optimistic add
      const optimistic = { ...article, region: 'Saved', category: 'All' };
      setSavedArticles(prev => [optimistic, ...prev]);
      try {
        await savedArticleService.saveArticle(TEST_USER_ID, article);
      } catch (err) {
        console.error('[SavedContext] saveArticle failed:', err.message);
        setSavedArticles(prev => prev.filter(a => a.id !== id));
      }
    }
  }, [savedArticleIds]);

  const isArticleSaved = useCallback((id) => savedArticleIds.has(id), [savedArticleIds]);

  const saveSearch = useCallback(async (query, dateFrom, dateTo) => {
    if (savedSearches.some(s => s.query === query)) return;
    const tempId = `temp-${Date.now()}`;
    const optimistic = { id: tempId, query, savedDate: new Date().toISOString(), dateFrom: dateFrom || null, dateTo: dateTo || null };
    setSavedSearches(prev => [optimistic, ...prev]);
    try {
      const real = await savedSearchService.saveSearch(TEST_USER_ID, { query, dateFrom, dateTo });
      setSavedSearches(prev => prev.map(s => s.id === tempId ? real : s));
    } catch (err) {
      console.error('[SavedContext] saveSearch failed:', err.message);
      setSavedSearches(prev => prev.filter(s => s.id !== tempId));
    }
  }, [savedSearches]);

  const unsaveSearch = useCallback(async (id) => {
    const removed = savedSearches.find(s => s.id === id);
    setSavedSearches(prev => prev.filter(s => s.id !== id));
    // Skip the API call for optimistic temp entries not yet persisted
    if (!String(id).startsWith('temp-')) {
      try {
        await savedSearchService.unsaveSearch(TEST_USER_ID, id);
      } catch (err) {
        console.error('[SavedContext] unsaveSearch failed:', err.message);
        if (removed) setSavedSearches(prev => [removed, ...prev]);
      }
    }
  }, [savedSearches]);

  const isSearchSaved = useCallback((query) =>
    savedSearches.some(s => s.query === query), [savedSearches]);

  const getSavedSearchId = useCallback((query) =>
    savedSearches.find(s => s.query === query)?.id, [savedSearches]);

  return (
    <SavedContext.Provider value={{
      savedArticles, savedArticleIds,
      toggleSaveArticle, isArticleSaved,
      savedSearches, saveSearch, unsaveSearch, isSearchSaved, getSavedSearchId,
    }}>
      {children}
    </SavedContext.Provider>
  );
}

export function useSaved() {
  const ctx = useContext(SavedContext);
  if (!ctx) throw new Error('useSaved must be used within SavedProvider');
  return ctx;
}

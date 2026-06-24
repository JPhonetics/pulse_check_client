import { createContext, useContext, useState, useCallback } from 'react';

const SavedContext = createContext(null);

export function SavedProvider({ children }) {
  const [savedArticleIds, setSavedArticleIds] = useState(new Set());
  const [savedSearches, setSavedSearches] = useState([]);

  const toggleSaveArticle = useCallback((articleId) => {
    setSavedArticleIds(prev => {
      const next = new Set(prev);
      if (next.has(articleId)) next.delete(articleId);
      else next.add(articleId);
      return next;
    });
  }, []);

  const isArticleSaved = useCallback((id) => savedArticleIds.has(id), [savedArticleIds]);

  const saveSearch = useCallback((query) => {
    setSavedSearches(prev => {
      if (prev.some(s => s.query === query)) return prev;
      return [{ id: `${Date.now()}`, query, savedDate: new Date().toISOString() }, ...prev];
    });
  }, []);

  const unsaveSearch = useCallback((id) => {
    setSavedSearches(prev => prev.filter(s => s.id !== id));
  }, []);

  const isSearchSaved = useCallback((query) =>
    savedSearches.some(s => s.query === query), [savedSearches]);

  const getSavedSearchId = useCallback((query) =>
    savedSearches.find(s => s.query === query)?.id, [savedSearches]);

  return (
    <SavedContext.Provider value={{
      savedArticleIds, toggleSaveArticle, isArticleSaved,
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

import { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import * as savedArticleService from '../services/savedArticleService';
import * as savedSearchService from '../services/savedSearchService';
import { useAuth } from './AuthContext';

const SavedContext = createContext(null);

export function SavedProvider({ children }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [savedArticles, setSavedArticles] = useState([]);
  const [savedSearches, setSavedSearches] = useState([]);

  const savedArticleIds = useMemo(
    () => new Set(savedArticles.map(a => a.id)),
    [savedArticles]
  );

  useEffect(() => {
    async function load() {
      if (!userId) { setSavedArticles([]); return; }
      try {
        const articles = await savedArticleService.getSavedArticles(userId);
        setSavedArticles(articles);
      } catch (err) {
        console.error('[SavedContext] Failed to load saved articles:', err.message);
      }
    }
    load();
  }, [userId]);

  useEffect(() => {
    async function load() {
      if (!userId) { setSavedSearches([]); return; }
      try {
        const searches = await savedSearchService.getSavedSearches(userId);
        setSavedSearches(searches);
      } catch (err) {
        console.error('[SavedContext] Failed to load saved searches:', err.message);
      }
    }
    load();
  }, [userId]);

  const toggleSaveArticle = useCallback(async (article) => {
    const id = article.id;
    if (savedArticleIds.has(id)) {
      setSavedArticles(prev => prev.filter(a => a.id !== id));
      try {
        await savedArticleService.unsaveArticle(userId, id);
      } catch (err) {
        console.error('[SavedContext] unsaveArticle failed:', err.message);
        setSavedArticles(prev => {
          const rollback = { ...article, region: 'Saved', category: 'All', snippet: article.snippet || '', imageUrl: article.imageUrl || '' };
          return [rollback, ...prev];
        });
      }
    } else {
      const optimistic = { ...article, region: 'Saved', category: 'All' };
      setSavedArticles(prev => [optimistic, ...prev]);
      try {
        await savedArticleService.saveArticle(userId, article);
      } catch (err) {
        console.error('[SavedContext] saveArticle failed:', err.message);
        setSavedArticles(prev => prev.filter(a => a.id !== id));
      }
    }
  }, [savedArticleIds, userId]);

  const isArticleSaved = useCallback((id) => savedArticleIds.has(id), [savedArticleIds]);

  const savedByGroup = useMemo(() => {
    const map = new Map();
    for (const a of savedArticles) {
      const key = a.groupKey ?? a.id;
      if (!map.has(key)) map.set(key, new Set());
      map.get(key).add(a.id);
    }
    return map;
  }, [savedArticles]);

  const getGroupSaveState = useCallback((groupKey, sourceIds) => {
    const saved = savedByGroup.get(groupKey) ?? new Set();
    const count = sourceIds.filter(id => saved.has(id)).length;
    if (count === 0) return 'none';
    if (count === sourceIds.length) return 'all';
    return 'some';
  }, [savedByGroup]);

  const saveGroup = useCallback(async (sources) => {
    if (!userId) return;
    const newArticles = sources.map(s => ({
      id: s.id,
      region: 'Saved',
      category: 'All',
      title: s.title,
      publishDate: s.publishDate,
      source: s.source,
      snippet: s.snippet || '',
      imageUrl: s.imageUrl || '',
      url: s.url,
      groupKey: s.groupKey ?? null,
    }));
    const toAdd = newArticles.filter(a => !savedArticleIds.has(a.id));
    setSavedArticles(prev => [...prev, ...toAdd]);
    try {
      await savedArticleService.saveArticles(userId, sources);
    } catch (err) {
      console.error('[SavedContext] saveGroup failed:', err.message);
      setSavedArticles(prev => prev.filter(a => !toAdd.some(t => t.id === a.id)));
    }
  }, [userId, savedArticleIds]);

  const unsaveGroup = useCallback(async (articleIds) => {
    if (!userId) return;
    const removed = savedArticles.filter(a => articleIds.includes(a.id));
    setSavedArticles(prev => prev.filter(a => !articleIds.includes(a.id)));
    try {
      await savedArticleService.unsaveArticles(userId, articleIds);
    } catch (err) {
      console.error('[SavedContext] unsaveGroup failed:', err.message);
      setSavedArticles(prev => [...prev, ...removed]);
    }
  }, [userId, savedArticles]);

  const toggleGroupSource = useCallback(async (source, groupKey) => {
    const article = {
      id: source.id,
      region: 'Saved',
      category: 'All',
      title: source.title,
      publishDate: source.publishDate,
      source: source.source,
      snippet: source.snippet || '',
      imageUrl: source.imageUrl || '',
      url: source.url,
      groupKey,
    };
    await toggleSaveArticle(article);
  }, [toggleSaveArticle]);

  const saveSearch = useCallback(async (query, dateFrom, dateTo) => {
    if (savedSearches.some(s => s.query === query)) return;
    const tempId = `temp-${Date.now()}`;
    const optimistic = { id: tempId, query, savedDate: new Date().toISOString(), dateFrom: dateFrom || null, dateTo: dateTo || null };
    setSavedSearches(prev => [optimistic, ...prev]);
    try {
      const real = await savedSearchService.saveSearch(userId, { query, dateFrom, dateTo });
      setSavedSearches(prev => prev.map(s => s.id === tempId ? real : s));
    } catch (err) {
      console.error('[SavedContext] saveSearch failed:', err.message);
      setSavedSearches(prev => prev.filter(s => s.id !== tempId));
    }
  }, [savedSearches, userId]);

  const unsaveSearch = useCallback(async (id) => {
    const removed = savedSearches.find(s => s.id === id);
    setSavedSearches(prev => prev.filter(s => s.id !== id));
    if (!String(id).startsWith('temp-')) {
      try {
        await savedSearchService.unsaveSearch(userId, id);
      } catch (err) {
        console.error('[SavedContext] unsaveSearch failed:', err.message);
        if (removed) setSavedSearches(prev => [removed, ...prev]);
      }
    }
  }, [savedSearches, userId]);

  const isSearchSaved = useCallback((query) =>
    savedSearches.some(s => s.query === query), [savedSearches]);

  const getSavedSearchId = useCallback((query) =>
    savedSearches.find(s => s.query === query)?.id, [savedSearches]);

  return (
    <SavedContext.Provider value={{
      savedArticles, savedArticleIds,
      toggleSaveArticle, isArticleSaved,
      savedSearches, saveSearch, unsaveSearch, isSearchSaved, getSavedSearchId,
      savedByGroup, getGroupSaveState, saveGroup, unsaveGroup, toggleGroupSource,
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

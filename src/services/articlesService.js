// ─── Stage 2: delegates to newsService ───────────────────────────────────────
// Callers use these stable exports; internals swap from mock JSON to real APIs.
export { getArticles, searchArticles } from './newsService.js';

// getArticlesByIds is retired — SavedArticlesPage now reads from savedArticleService directly.
export function getArticlesByIds() {
  return { articles: [], totalPages: 1, total: 0, page: 1 };
}

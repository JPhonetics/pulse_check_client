import allArticles from '../data/articles.json';

// ─── Public API ──────────────────────────────────────────────────────────────
// Replace the internals of this module with real API calls in Stage 2.
// Callers never import articles.json directly.

const PAGE_SIZE = 9;

/**
 * @param {Object} opts
 * @param {'World'|'US'|'Local'} [opts.region]
 * @param {string} [opts.category]      - sub-category name, or 'All'
 * @param {number} [opts.page]          - 1-indexed
 * @param {'asc'|'desc'} [opts.sort]    - by publishDate
 * @returns {{ articles: Array, totalPages: number, total: number }}
 */
export function getArticles({ region = 'World', category = 'All', page = 1, sort = 'desc' } = {}) {
  let results = [...allArticles];

  if (region) {
    results = results.filter(a => a.region === region);
  }

  if (category && category !== 'All') {
    results = results.filter(a => a.category === category);
  }

  results = sortByDate(results, sort);

  return paginate(results, page);
}

/**
 * @param {Object} opts
 * @param {string} opts.query
 * @param {string} [opts.dateFrom]   - ISO date string
 * @param {string} [opts.dateTo]     - ISO date string
 * @param {number} [opts.page]
 * @param {'asc'|'desc'} [opts.sort]
 */
export function searchArticles({ query = '', dateFrom, dateTo, page = 1, sort = 'desc' } = {}) {
  const term = query.toLowerCase().trim();

  let results = allArticles.filter(a => {
    const inTitle = a.title.toLowerCase().includes(term);
    const inSnippet = a.snippet.toLowerCase().includes(term);
    return inTitle || inSnippet;
  });

  if (dateFrom) {
    const from = new Date(dateFrom);
    results = results.filter(a => new Date(a.publishDate) >= from);
  }

  if (dateTo) {
    const to = new Date(dateTo);
    to.setHours(23, 59, 59, 999);
    results = results.filter(a => new Date(a.publishDate) <= to);
  }

  results = sortByDate(results, sort);

  return paginate(results, page);
}

/**
 * @param {Object} opts
 * @param {string[]} opts.ids    - article IDs to fetch
 * @param {'asc'|'desc'} [opts.sort]
 * @param {number} [opts.page]
 */
export function getArticlesByIds({ ids = [], sort = 'desc', page = 1 } = {}) {
  const idSet = new Set(ids);
  let results = allArticles.filter(a => idSet.has(a.id));
  results = sortByDate(results, sort);
  return paginate(results, page);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function sortByDate(articles, sort) {
  return [...articles].sort((a, b) => {
    const diff = new Date(b.publishDate) - new Date(a.publishDate);
    return sort === 'asc' ? -diff : diff;
  });
}

function paginate(articles, page) {
  const total = articles.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * PAGE_SIZE;
  return {
    articles: articles.slice(start, start + PAGE_SIZE),
    totalPages,
    total,
    page: safePage,
  };
}

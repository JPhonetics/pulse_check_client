import { supabaseHttp, newsdataHttp } from './http.js';

const PAGE_SIZE = 9;
const CACHE_TTL_MS = 15 * 60 * 1000;

// Maps app sub-category labels to newsdata.io category param values.
// Weather has no newsdata.io category; it uses q="weather" and is stored as 'weather' in cache.
const ND_CATEGORY = {
  Business: 'business',
  Crime: 'crime',
  Entertainment: 'entertainment',
  Health: 'health',
  Politics: 'politics',
  Sports: 'sports',
  Tech: 'technology',
};

// "Austin, TX" → { city: "Austin", state: "TX" }
function parseLocalRegion(str) {
  if (!str) return { city: '', state: '' };
  const idx = str.lastIndexOf(',');
  if (idx === -1) return { city: str.trim(), state: '' };
  return { city: str.slice(0, idx).trim(), state: str.slice(idx + 1).trim() };
}

function parseCount(header) {
  const m = String(header || '').match(/\/(\d+)$/);
  return m ? parseInt(m[1], 10) : 0;
}

// Maps a newsdata.io article object to an article_cache insert row.
function toCache(a, country, cacheCategory) {
  return {
    article_id: a.article_id,
    title: a.title || '',
    description: a.description || null,
    article_url: a.link || '',
    image_url: a.image_url || null,
    published_at: a.pubDate || new Date().toISOString(),
    source: a.source_id || '',
    country: country ?? null,
    category: cacheCategory ?? null,
  };
}

// Maps an article_cache row to the app article shape.
function cacheToArticle(row, region, category) {
  return {
    id: row.article_id,
    region,
    category,
    title: row.title,
    publishDate: row.published_at,
    source: row.source,
    snippet: row.description || '',
    imageUrl: row.image_url || '',
    url: row.article_url,
  };
}

// Maps a raw newsdata.io result to the app article shape (bypassing cache).
function rawToArticle(raw, region, category) {
  return {
    id: raw.article_id,
    region,
    category,
    title: raw.title || '',
    publishDate: raw.pubDate || '',
    source: raw.source_id || '',
    snippet: raw.description || '',
    imageUrl: raw.image_url || '',
    url: raw.link || '',
  };
}

// Returns true if the cache for a given country+category was populated within the TTL.
async function isCacheFresh(country, cacheCategory) {
  const params = { select: 'fetched_at', order: 'fetched_at.desc', limit: 1 };
  params.country = country == null ? 'is.null' : `eq.${country}`;
  params.category = cacheCategory == null ? 'is.null' : `eq.${cacheCategory}`;
  try {
    const res = await supabaseHttp.get('/article_cache', { params });
    if (!res.data.length) return false;
    return Date.now() - new Date(res.data[0].fetched_at).getTime() < CACHE_TTL_MS;
  } catch {
    return false;
  }
}

// Calls newsdata.io /latest; always injects apikey + language.
async function fetchNewsdata(extra = {}) {
  const res = await newsdataHttp.get('/latest', {
    params: { apikey: import.meta.env.VITE_NEWSDATA_API_KEY, language: 'en', ...extra },
  });
  // Filter out articles missing required fields
  return (res.data.results || []).filter(a => a.article_id && a.pubDate);
}

// Upserts an array of newsdata.io articles into article_cache.
async function upsertCache(articles, country, cacheCategory) {
  if (!articles.length) return;
  const rows = articles.map(a => toCache(a, country, cacheCategory));
  await supabaseHttp.post('/article_cache', rows, {
    headers: { Prefer: 'resolution=merge-duplicates' },
  });
}

// Queries a paginated page from the cache for a given country+category.
async function fetchCachePage({ country, cacheCategory, page, sort = 'desc' }) {
  const params = {
    order: `published_at.${sort}`,
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  };
  params.country = country == null ? 'is.null' : `eq.${country}`;
  params.category = cacheCategory == null ? 'is.null' : `eq.${cacheCategory}`;
  const res = await supabaseHttp.get('/article_cache', {
    params,
    headers: { Prefer: 'count=exact' },
  });
  const total = parseCount(res.headers['content-range']);
  return { rows: res.data, total };
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Fetches a paginated page of articles for World or US regions via the cache-through layer.
 * Local region always bypasses the TTL check and calls newsdata.io directly.
 *
 * @returns {{ articles, totalPages, total, page, localBanner }}
 *   localBanner is { city, state } when the Local state-fallback was triggered, else null.
 */
export async function getArticles({ region = 'World', category = 'All', page = 1, localRegion = null } = {}) {
  if (region === 'Local') {
    return getLocalArticles({ category, page, localRegion });
  }

  const country = region === 'US' ? 'us' : null;
  const cacheCategory = category === 'All' ? null
    : category === 'Weather' ? 'weather'
    : (ND_CATEGORY[category] ?? null);

  // Refresh cache if stale
  const fresh = await isCacheFresh(country, cacheCategory);
  if (!fresh) {
    try {
      const ndParams = {};
      if (country) ndParams.country = country;
      if (category !== 'All') {
        if (category === 'Weather') ndParams.q = 'weather';
        else if (ND_CATEGORY[category]) ndParams.category = ND_CATEGORY[category];
      }
      const raw = await fetchNewsdata(ndParams);
      await upsertCache(raw, country, cacheCategory);
    } catch (err) {
      console.error('[newsService] Cache refresh failed, serving stale:', err.message);
    }
  }

  const { rows, total } = await fetchCachePage({ country, cacheCategory, page });
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  return {
    articles: rows.map(r => cacheToArticle(r, region, category)),
    totalPages,
    total,
    page,
    localBanner: null,
  };
}

// Handles Local region: always fetches live with city keyword, falls back to state.
async function getLocalArticles({ category = 'All', page = 1, localRegion }) {
  const { city, state } = parseLocalRegion(localRegion);
  if (!city) return { articles: [], totalPages: 1, total: 0, page: 1, localBanner: null };

  const cacheCategory = category === 'All' ? null
    : category === 'Weather' ? 'weather'
    : (ND_CATEGORY[category] ?? null);

  const ndExtra = {};
  if (cacheCategory && cacheCategory !== 'weather') ndExtra.category = cacheCategory;

  let raw = [];
  let localBanner = null;

  try {
    const qCity = category === 'Weather' ? `${city} weather` : city;
    raw = await fetchNewsdata({ country: 'us', q: qCity, ...ndExtra });
    await upsertCache(raw, 'us', cacheCategory);

    if (raw.length < PAGE_SIZE && state) {
      const qState = category === 'Weather' ? `${state} weather` : state;
      const stateRaw = await fetchNewsdata({ country: 'us', q: qState, ...ndExtra });
      await upsertCache(stateRaw, 'us', cacheCategory);
      raw = stateRaw;
      localBanner = { city, state };
    }
  } catch (err) {
    console.error('[newsService] Local fetch failed:', err.message);
  }

  // Relevance pass: articles with city name in title float to the top
  const cityLc = city.toLowerCase();
  raw.sort((a, b) => {
    const ah = (a.title || '').toLowerCase().includes(cityLc);
    const bh = (b.title || '').toLowerCase().includes(cityLc);
    return ah === bh ? 0 : ah ? -1 : 1;
  });

  const total = raw.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const start = (page - 1) * PAGE_SIZE;
  const articles = raw.slice(start, start + PAGE_SIZE).map(r => rawToArticle(r, 'Local', category));

  return { articles, totalPages, total, page, localBanner };
}

/**
 * Searches the article_cache by keyword (title OR description), with optional date range and sort.
 * Does NOT call newsdata.io — operates entirely on cached content.
 */
export async function searchArticles({ query = '', dateFrom, dateTo, page = 1, sort = 'desc' } = {}) {
  const term = query.trim();
  if (!term) return { articles: [], totalPages: 1, total: 0, page: 1 };

  // Build query string manually to support duplicate keys (dateFrom + dateTo on published_at)
  // and to avoid URLSearchParams double-encoding the % wildcard in ilike patterns.
  const qs = new URLSearchParams();
  qs.append('or', `(title.ilike.%${term}%,description.ilike.%${term}%)`);
  qs.append('order', `published_at.${sort}`);
  qs.append('limit', String(PAGE_SIZE));
  qs.append('offset', String((page - 1) * PAGE_SIZE));
  if (dateFrom) qs.append('published_at', `gte.${dateFrom}`);
  if (dateTo) qs.append('published_at', `lte.${dateTo}T23:59:59`);

  const res = await supabaseHttp.get(`/article_cache?${qs.toString()}`, {
    headers: { Prefer: 'count=exact' },
  });
  const total = parseCount(res.headers['content-range']);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const articles = res.data.map(r => cacheToArticle(r, 'Search', 'All'));
  return { articles, totalPages, total, page };
}

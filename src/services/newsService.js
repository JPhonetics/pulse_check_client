const FN_URL = `${import.meta.env.VITE_SUPABASE_BASE_URL}/functions/v1/get-news`;
const AUTH = `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`;

async function callFn(params) {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v != null && v !== '')
  );
  const res = await fetch(`${FN_URL}?${qs}`, { headers: { Authorization: AUTH } });
  if (!res.ok) throw new Error(`get-news: ${res.status} ${res.statusText}`);
  return res.json();
}

export async function getArticles({ region = 'World', category = 'All', page = 1, localRegion = null } = {}) {
  return callFn({ mode: 'browse', region, category, page, localRegion });
}

export async function searchArticles({ query = '', dateFrom, dateTo, page = 1, sort = 'desc' } = {}) {
  return callFn({ mode: 'search', query, dateFrom, dateTo, page, sort });
}

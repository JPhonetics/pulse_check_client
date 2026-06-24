import { supabaseHttp } from './http.js';

export async function getSavedSearches(userId) {
  const res = await supabaseHttp.get('/saved_search', {
    params: { user_id: `eq.${userId}`, order: 'saved_date.desc' },
  });
  return res.data.map(normalizeRow);
}

export async function saveSearch(userId, { query, dateFrom, dateTo }) {
  const res = await supabaseHttp.post('/saved_search', {
    user_id: userId,
    keywords: query,
    date_from: dateFrom || null,
    date_to: dateTo || null,
  }, {
    headers: { Prefer: 'return=representation' },
  });
  return normalizeRow(res.data[0]);
}

export async function unsaveSearch(userId, searchId) {
  await supabaseHttp.delete('/saved_search', {
    params: { id: `eq.${searchId}`, user_id: `eq.${userId}` },
  });
}

function normalizeRow(row) {
  return {
    id: row.id,
    query: row.keywords,
    savedDate: row.saved_date,
    dateFrom: row.date_from || null,
    dateTo: row.date_to || null,
  };
}

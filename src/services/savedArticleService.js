import { supabaseHttp } from './http.js';

export async function getSavedArticles(userId) {
  const res = await supabaseHttp.get('/saved_article', {
    params: { user_id: `eq.${userId}`, order: 'published_at.desc' },
  });
  return res.data.map(normalizeRow);
}

export async function saveArticle(userId, article) {
  await supabaseHttp.post('/saved_article', {
    user_id: userId,
    article_id: article.id,
    source: article.source,
    title: article.title,
    description: article.snippet || null,
    article_url: article.url,
    image_url: article.imageUrl || null,
    published_at: article.publishDate,
    group_key: article.groupKey ?? null,
  });
}

export async function saveArticles(userId, articles) {
  const body = articles.map(a => ({
    user_id: userId,
    article_id: a.id,
    source: a.source,
    title: a.title,
    description: a.snippet || null,
    article_url: a.url,
    image_url: a.imageUrl || null,
    published_at: a.publishDate,
    group_key: a.groupKey ?? null,
  }));
  await supabaseHttp.post('/saved_article', body, {
    headers: { Prefer: 'resolution=ignore-duplicates' },
  });
}

export async function unsaveArticles(userId, articleIds) {
  await supabaseHttp.delete('/saved_article', {
    params: {
      user_id: `eq.${userId}`,
      article_id: `in.(${articleIds.join(',')})`,
    },
  });
}

export async function unsaveArticle(userId, articleId) {
  await supabaseHttp.delete('/saved_article', {
    params: { user_id: `eq.${userId}`, article_id: `eq.${articleId}` },
  });
}

function normalizeRow(row) {
  return {
    id: row.article_id,
    savedRowId: row.id,
    savedDate: row.saved_date,
    region: 'Saved',
    category: 'All',
    title: row.title,
    publishDate: row.published_at,
    source: row.source,
    snippet: row.description || '',
    imageUrl: row.image_url || '',
    url: row.article_url,
    groupKey: row.group_key ?? null,
  };
}

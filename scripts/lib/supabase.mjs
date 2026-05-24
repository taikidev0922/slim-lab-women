let pgPool;

export const hasSupabase = true;

export function hasSupabaseConnection() {
  return Boolean(
    (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) || process.env.DATABASE_URL
  );
}

async function request(path, options = {}) {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, '');
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  const response = await fetch(`${url}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
      ...(options.headers || {})
    }
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Supabase ${response.status}: ${text}`);
  }
  if (response.status === 204) return null;
  return response.json();
}

async function query(sql, params = []) {
  if (!process.env.DATABASE_URL) return null;
  if (!pgPool) {
    const { Pool } = await import('pg');
    pgPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
  }
  const result = await pgPool.query(sql, params);
  return result.rows;
}

function hasRest() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export async function upsertKeywords(items) {
  if (!items.length || !hasSupabaseConnection()) return [];
  if (hasRest()) {
    return request('keywords?on_conflict=keyword', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
      body: JSON.stringify(items)
    });
  }
  const rows = [];
  for (const item of items) {
    const inserted = await query(
      `insert into public.keywords
        (keyword, source, search_volume, seo_difficulty, cpc, competition, first_seen_range, intent, score, status, fetched_at, updated_at)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       on conflict (keyword) do update set
        source = excluded.source,
        search_volume = excluded.search_volume,
        seo_difficulty = excluded.seo_difficulty,
        cpc = excluded.cpc,
        competition = excluded.competition,
        first_seen_range = excluded.first_seen_range,
        intent = excluded.intent,
        score = greatest(public.keywords.score, excluded.score),
        updated_at = excluded.updated_at
       returning *`,
      [
        item.keyword,
        item.source,
        item.search_volume,
        item.seo_difficulty,
        item.cpc,
        item.competition,
        item.first_seen_range,
        item.intent,
        item.score,
        item.status,
        item.fetched_at,
        item.updated_at
      ]
    );
    rows.push(...(inserted || []));
  }
  return rows;
}

export async function getUsedKeywords() {
  if (!hasSupabaseConnection()) return [];
  if (!hasRest()) {
    const rows = await query('select keyword from public.keywords where status = $1', ['used']);
    return (rows || []).map((r) => r.keyword);
  }
  const rows = await request('keywords?status=eq.used&select=keyword');
  return (rows || []).map((r) => r.keyword);
}

export async function rejectKeyword(id) {
  if (!hasSupabaseConnection() || !id) return null;
  if (!hasRest()) {
    return query(
      'update public.keywords set status = $1, updated_at = now() where id = $2',
      ['rejected', id]
    );
  }
  return request(`keywords?id=eq.${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'rejected', updated_at: new Date().toISOString() })
  });
}

export async function getCandidateKeyword() {
  if (!hasSupabaseConnection()) return null;
  if (!hasRest()) {
    const rows = await query('select * from public.keywords where status = $1 order by score desc limit 1', ['unused']);
    return rows?.[0] || null;
  }
  const rows = await request('keywords?status=eq.unused&order=score.desc&limit=1');
  return rows?.[0] || null;
}

export async function reserveKeyword(id) {
  if (!hasSupabaseConnection() || !id) return null;
  if (!hasRest()) {
    return query(
      'update public.keywords set status = $1, reserved_at = now(), updated_at = now() where id = $2 returning *',
      ['reserved', id]
    );
  }
  return request(`keywords?id=eq.${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'reserved', reserved_at: new Date().toISOString(), updated_at: new Date().toISOString() })
  });
}

export async function markKeywordUsed(keyword, slug) {
  if (!hasSupabaseConnection() || !keyword) return null;
  if (!hasRest()) {
    return query(
      'update public.keywords set status = $1, used_article_slug = $2, used_at = now(), updated_at = now() where keyword = $3 returning *',
      ['used', slug, keyword]
    );
  }
  return request(`keywords?keyword=eq.${encodeURIComponent(keyword)}`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'used', used_article_slug: slug, used_at: new Date().toISOString(), updated_at: new Date().toISOString() })
  });
}

export async function insertArticle(article) {
  if (!hasSupabaseConnection()) return null;
  if (!hasRest()) {
    return query(
      `insert into public.articles (slug, title, description, keyword, category, published_at, path)
       values ($1,$2,$3,$4,$5,$6,$7)
       on conflict (slug) do nothing
       returning *`,
      [article.slug, article.title, article.description, article.keyword, article.category, article.published_at, article.path]
    );
  }
  return request('articles?on_conflict=slug', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
    body: JSON.stringify(article)
  });
}

export async function logUsage(provider, endpoint, consumedCredit = 0, metadata = {}) {
  if (!hasSupabaseConnection()) return null;
  if (!hasRest()) {
    return query(
      'insert into public.api_usage (provider, endpoint, consumed_credit, metadata) values ($1,$2,$3,$4) returning *',
      [provider, endpoint, consumedCredit, metadata]
    );
  }
  return request('api_usage', { method: 'POST', body: JSON.stringify({ provider, endpoint, consumed_credit: consumedCredit, metadata }) });
}

export async function countUnusedKeywords() {
  if (!hasSupabaseConnection()) return 0;
  if (!hasRest()) {
    const rows = await query('select count(*)::int as count from public.keywords where status = $1', ['unused']);
    return rows?.[0]?.count || 0;
  }
  const url = process.env.SUPABASE_URL?.replace(/\/$/, '');
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const response = await fetch(`${url}/rest/v1/keywords?status=eq.unused&select=id`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      Prefer: 'count=exact'
    }
  });
  return Number(response.headers.get('content-range')?.split('/')?.[1] || 0);
}

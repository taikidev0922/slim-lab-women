create table if not exists public.keywords (
  id bigserial primary key,
  keyword text not null unique,
  source text not null default 'seed',
  search_volume integer,
  seo_difficulty numeric,
  cpc numeric,
  competition numeric,
  first_seen_range text,
  intent text,
  score numeric not null default 0,
  status text not null default 'unused' check (status in ('unused', 'reserved', 'used', 'rejected')),
  used_article_slug text,
  fetched_at timestamptz not null default now(),
  reserved_at timestamptz,
  used_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists keywords_status_score_idx on public.keywords (status, score desc);
create index if not exists keywords_fetched_at_idx on public.keywords (fetched_at desc);

create table if not exists public.articles (
  id bigserial primary key,
  slug text not null unique,
  title text not null,
  description text not null,
  keyword text,
  category text not null default '女性ダイエット',
  published_at timestamptz not null default now(),
  path text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.api_usage (
  id bigserial primary key,
  provider text not null,
  endpoint text not null,
  consumed_credit numeric default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

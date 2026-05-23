# 美スリム研究所

女性のダイエット情報に特化した、フレームワークなしの静的SEOサイトです。

## 構成

- `index.html`: トップページ
- `blog/index.html`: ブログ一覧
- `blog/[slug]/index.html`: 記事ページ
- `scripts/generate-article.mjs`: Claude APIで記事を生成し、gpt-imageで記事画像を生成
- `scripts/refresh-keywords.mjs`: ラッコキーワードAPIから低競合キーワードをSupabaseへ蓄積
- `supabase/schema.sql`: キーワード、記事、API利用履歴のテーブル定義
- `.github/workflows/daily-blog.yml`: 毎日6時に記事生成してpush

## 必要な環境変数

GitHub Actions Secrets / ローカル環境に設定します。

- `ANTHROPIC_API_KEY`
- `OPENAI_API_KEY`
- `RAKKO_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SITE_URL` 任意。未指定時は `site.config.json` の値を使用
- `DRY_RUN` 任意。`true` でファイル生成とDB更新を行いません

## 初期セットアップ

1. `memo.txt` から `.env` を作成
2. `npm run db:init` でSupabaseにテーブルを作成
3. `npm run keywords:seed-reference` でFitstage参考キーワードを投入
4. GitHub SecretsにAPIキーと `DATABASE_URL` を設定
5. `site.config.json` の `siteUrl` を本番ドメインに変更
6. GitHubにpush

ローカル確認:

```bash
npm run validate
npm run blog:auto-post:dry
```

Supabase REST APIの `service_role` がない場合でも、`DATABASE_URL` があればPostgresへ直接接続してキーワードと記事状態を管理できます。

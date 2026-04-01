# Social Harness セットアップガイド

## 前提条件

| ツール | バージョン | 用途 |
|--------|-----------|------|
| Node.js | 20+ | Next.js フロントエンド |
| npm | 10+ | パッケージ管理 |
| wrangler | 3+ | Cloudflare Workers デプロイ |
| git | 2+ | ソースコード管理 |

### 必要なアカウント

- [Supabase](https://supabase.com) — データベース・認証
- [Vercel](https://vercel.com) — フロントエンドホスティング
- [Cloudflare](https://cloudflare.com) — Workers (Cron Jobs)
- [Meta Developer](https://developers.facebook.com) — Instagram / Threads API
- [Google Cloud Console](https://console.cloud.google.com) — YouTube API
- [TikTok Developer](https://developers.tiktok.com) — TikTok API
- (オプション) [X Developer](https://developer.x.com) — X API ($200/月〜)

---

## 1. リポジトリのクローン

```bash
git clone https://github.com/daisukeishioka-pixel/social-harness-oss.git
cd social-harness-oss
```

---

## 2. Supabase セットアップ

### 2.1 プロジェクト作成

1. [Supabase Dashboard](https://supabase.com/dashboard) で新しいプロジェクトを作成
2. リージョンは `Northeast Asia (Tokyo)` を推奨
3. プロジェクト作成後、Settings > API から以下を控える:
   - **Project URL** (`https://xxxxx.supabase.co`)
   - **anon public key**
   - **service_role key** (秘密にすること)

### 2.2 スキーマ投入

SQL Editor で `supabase/migrations/001_initial_schema.sql` の内容を実行する。

作成されるオブジェクト:
- テーブル: `tenants`, `platform_accounts`, `posts`, `insights_snapshots`, `account_metrics`, `scheduled_posts`, `ai_suggestions`, `user_profiles`
- ENUM: `platform_type`, `post_status`
- ビュー: `v_post_performance`
- 関数: `update_updated_at()`, `custom_access_token_hook()`, `date_trunc_hour_immutable()`

### 2.3 Auth Hook の設定

JWT に `tenant_id` を含めるために Auth Hook を設定する:

1. Supabase Dashboard > Authentication > Hooks
2. 「Custom access token」フックを有効化
3. 関数に `public.custom_access_token_hook` を選択
4. 保存

### 2.4 認証設定

1. Authentication > Providers > Email で以下を確認:
   - Email provider が有効
   - 「Confirm email」は本番では有効、開発中は無効でもOK
2. Authentication > URL Configuration:
   - Site URL: `https://your-vercel-domain.vercel.app`
   - Redirect URLs: `https://your-vercel-domain.vercel.app/**`

---

## 3. Meta Developer (Instagram / Threads)

### 3.1 アプリ作成

1. [Meta Developer](https://developers.facebook.com) > My Apps > Create App
2. アプリタイプ: 「Business」
3. アプリ名: 任意（例: Social Harness）

### 3.2 Instagram Graph API

1. Products > Instagram Graph API > Set Up
2. 必要な権限:
   - `instagram_basic`
   - `instagram_manage_insights`
   - `instagram_content_publish`
   - `pages_show_list`
3. App Settings > Basic から控える:
   - **App ID**
   - **App Secret**
4. Valid OAuth Redirect URIs に追加:
   ```
   https://your-vercel-domain.vercel.app/api/auth/instagram/callback
   ```

### 3.3 Threads API

1. Products > Threads API > Set Up
2. 必要な権限:
   - `threads_basic`
   - `threads_content_publish`
   - `threads_manage_insights`
3. Valid OAuth Redirect URIs に追加:
   ```
   https://your-vercel-domain.vercel.app/api/auth/threads/callback
   ```

---

## 4. Google Cloud (YouTube)

### 4.1 プロジェクト作成

1. [Google Cloud Console](https://console.cloud.google.com) > New Project
2. プロジェクト名: 任意

### 4.2 API 有効化

APIs & Services > Library から以下を有効化:
- YouTube Data API v3
- YouTube Analytics API

### 4.3 OAuth 同意画面

1. APIs & Services > OAuth consent screen
2. User Type: External
3. スコープ追加:
   - `https://www.googleapis.com/auth/youtube.readonly`
   - `https://www.googleapis.com/auth/youtube.upload`
   - `https://www.googleapis.com/auth/yt-analytics.readonly`

### 4.4 OAuth クライアント

1. APIs & Services > Credentials > Create Credentials > OAuth client ID
2. Application type: Web application
3. Authorized redirect URIs:
   ```
   https://your-vercel-domain.vercel.app/api/auth/youtube/callback
   ```
4. 控える:
   - **Client ID**
   - **Client Secret**

---

## 5. TikTok Developer

### 5.1 アプリ登録

1. [TikTok Developer Portal](https://developers.tiktok.com) > Manage Apps > Create
2. 必要なスコープ:
   - `user.info.basic`
   - `user.info.stats`
   - `video.list`
   - `video.publish`
   - `video.upload`
3. Redirect URI:
   ```
   https://your-vercel-domain.vercel.app/api/auth/tiktok/callback
   ```
4. 控える:
   - **Client Key**
   - **Client Secret**

---

## 6. X (Twitter) API (オプション)

X API の利用にはクライアントが月額 $200〜 のサブスクリプションを負担する必要がある。

1. [X Developer Portal](https://developer.x.com) > Projects & Apps
2. Basic ($200/月) 以上のプランに加入
3. API キーを取得:
   - API Key
   - API Secret
   - Access Token
   - Access Token Secret
4. Social Harness の設定画面 (Settings > X APIキー) から入力

X の API キーは環境変数ではなく `platform_accounts.metadata` の JSONB フィールドに保存される。

---

## 7. Anthropic API (AI 機能)

1. [Anthropic Console](https://console.anthropic.com) > API Keys
2. 新しい API キーを作成
3. 控える: **API Key**
4. 使用モデル: `claude-sonnet-4-6`

---

## 8. フロントエンド (Next.js) セットアップ

### 8.1 依存関係インストール

```bash
cd web
npm install
```

### 8.2 環境変数

`.env.local` を作成:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

# Meta (Instagram / Threads)
META_APP_ID=123456789
META_APP_SECRET=abc123...
NEXT_PUBLIC_META_APP_ID=123456789

# Threads (Instagram とは別の App ID の場合)
THREADS_APP_ID=123456789
THREADS_APP_SECRET=abc123...

# Google (YouTube)
GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxx

# TikTok
TIKTOK_CLIENT_KEY=xxxxx
TIKTOK_CLIENT_SECRET=xxxxx

# Anthropic
ANTHROPIC_API_KEY=sk-ant-xxxxx

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 8.3 ローカル起動

```bash
npm run dev
```

`http://localhost:3000` でアクセス可能。

---

## 9. Cloudflare Workers セットアップ

### 9.1 依存関係インストール

```bash
cd workers
npm install
```

### 9.2 シークレット設定

```bash
wrangler secret put SUPABASE_SERVICE_ROLE_KEY
wrangler secret put META_APP_SECRET
wrangler secret put GOOGLE_CLIENT_ID
wrangler secret put GOOGLE_CLIENT_SECRET
```

### 9.3 デプロイ

```bash
wrangler deploy
```

### 9.4 Cron Triggers 確認

デプロイ後、Cloudflare Dashboard > Workers > social-harness-workers > Triggers で以下が登録されていることを確認:

| スケジュール | 処理内容 |
|-------------|---------|
| 毎分 (`* * * * *`) | 予約投稿の実行 |
| 毎時 (`0 * * * *`) | インサイト収集 |
| 毎日 3:00 (`0 3 * * *`) | アカウントメトリクス収集 |
| 毎週月曜 6:00 (`0 6 * * 1`) | トークンリフレッシュ |

---

## 10. Vercel デプロイ

### 10.1 初回デプロイ

```bash
cd web
npx vercel --prod
```

### 10.2 環境変数

Vercel Dashboard > Project Settings > Environment Variables に `.env.local` と同じ変数を設定。

`NEXT_PUBLIC_APP_URL` は Vercel のドメインに更新:
```
https://your-project.vercel.app
```

### 10.3 OAuth リダイレクト URL の更新

各プラットフォームの Developer Console で、コールバック URL を Vercel ドメインに変更:

- Meta: `https://your-domain.vercel.app/api/auth/instagram/callback`
- Threads: `https://your-domain.vercel.app/api/auth/threads/callback`
- Google: `https://your-domain.vercel.app/api/auth/youtube/callback`
- TikTok: `https://your-domain.vercel.app/api/auth/tiktok/callback`

---

## 11. 初期データ投入

Supabase SQL Editor で最初のテナントを作成するか、アプリのサインアップページ (`/signup`) から登録する。

### サインアップフローで自動作成されるもの:
1. `auth.users` にユーザーが作成される
2. `tenants` にテナントが作成される
3. `user_profiles` にユーザーとテナントの紐付けが作成される（role: owner）
4. JWT に `tenant_id` クレームが付与される

---

## トラブルシューティング

### OAuth コールバックで「Invalid redirect URI」エラー

各プラットフォームの Developer Console で Redirect URI が完全一致しているか確認。末尾のスラッシュの有無に注意。

### Supabase RLS でデータが取得できない

- JWT に `tenant_id` クレームが含まれているか確認（Supabase Auth Hook の設定漏れ）
- `user_profiles` テーブルにレコードがあるか確認
- API Routes では `createServiceClient()` (service_role) を使用しているか確認

### Workers の Cron が動かない

```bash
wrangler tail
```
でログを確認。シークレットが設定されていない場合はエラーが出る。

### トークン期限切れ

- Instagram/Threads: 60日で期限切れ。毎週月曜のトークンリフレッシュ Cron で自動更新される
- YouTube: `refresh_token` は無期限。`access_token` は1時間で期限切れだが、リクエスト時に自動更新
- TikTok: `access_token` 24時間、`refresh_token` 365日

### ビルドエラー: `Module not found`

```bash
cd web
rm -rf node_modules .next
npm install
npm run build
```

---

## ライセンス

MIT License - 詳細は [LICENSE](../LICENSE) を参照。

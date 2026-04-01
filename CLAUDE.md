# Social Harness — Claude Code 作業指示

## プロジェクト概要
Social Harness（`social-harness-oss`）は、Instagram / YouTube / Threads を一元管理するOSSのSNSマーケティングプラットフォーム。株式会社No Sideが開発・受託提供。

GitHub: https://github.com/daisukeishioka-pixel/social-harness-oss

## 現在の状態
- Next.js App Router + Tailwind + shadcn/ui でウェブアプリの骨格構築済み
- Threads / Instagram / YouTube / X の各API統合ユーティリティ実装済み（`web/src/lib/platforms/`）
- Supabaseスキーマ定義済み（`supabase/migrations/001_initial_schema.sql`）
- OAuth callbackルート実装済み（Threads / Instagram）
- ダッシュボードのUIシェル構築済み（接続カード・KPIカード・タブ）

## 次の作業（優先順）

### 1. Supabaseにスキーマを投入
既存のSupabaseプロジェクト（`lcisydaplexmehwxopdz`）に、`supabase/migrations/001_initial_schema.sql` のスキーマを投入する。
既存のRESISTテーブルとは衝突しないが、念のため確認してから実行すること。

### 2. YouTube OAuth callbackルートを実装
`web/src/app/api/auth/youtube/callback/route.ts` を作成。
`web/src/lib/platforms/youtube.ts` の `exchangeYouTubeCode` を使って、Threads/Instagramのcallbackと同じパターンで実装。

### 3. ダッシュボードにRechartsグラフを追加
`web/src/app/dashboard/page.tsx` の各TabsContent内に、Rechartsを使ったパフォーマンスチャートを実装。
- フォロワー推移（AreaChart）
- エンゲージメント率推移（LineChart）
- 投稿別パフォーマンス比較（BarChart）

データソースは `insights_snapshots` テーブルと `account_metrics` テーブル。
接続前はモックデータで表示し、接続後にSupabaseからリアルデータを取得する形にする。

### 4. Cloudflare Worker: インサイト定期収集
`workers/src/cron/collect-insights.ts` を作成。
1時間ごとに各プラットフォームの API をポーリングし、`insights_snapshots` と `account_metrics` にUPSERT。
Cloudflare Workers の Cron Triggers を使用。
`wrangler.toml` に cron trigger 設定を追加。

### 5. 投稿スケジューラーUI
`web/src/app/dashboard/scheduler/page.tsx` を作成。
カレンダーUIで予約投稿を管理。`scheduled_posts` テーブルと連携。
クロスポスト（同一コンテンツを複数プラットフォームに同時投稿）に対応。

## 技術的な注意事項

### Git設定
```
user.name = "daisuke"
user.email = "daisuke.ishioka@noside-official.com"
```

### Supabase
- プロジェクトID: `lcisydaplexmehwxopdz`
- URL: `https://lcisydaplexmehwxopdz.supabase.co`

### Meta Developer App
- 「Threads Analytics Pro」として既にアプリ作成済み
- `threads_basic`, `threads_content_publish`, `threads_manage_insights` 権限追加済み
- Instagram Graph API のプロダクトを追加する必要あり

### API設計原則
- 各プラットフォームのAPIキーは環境変数ではなく `platform_accounts.metadata` に格納（Xの場合はクライアント持ち込み）
- トークンのリフレッシュは Cloudflare Workers の Cron で定期実行
- RLS でテナント分離（`tenant_id` ベース）

### ファイル構成
```
social-harness-oss/
├── web/                          # Next.js フロントエンド
│   └── src/
│       ├── app/
│       │   ├── api/auth/         # OAuth callbacks（Threads, IG実装済み、YT未実装）
│       │   └── dashboard/        # ダッシュボードページ
│       ├── components/
│       │   ├── dashboard/        # ダッシュボード用コンポーネント
│       │   └── ui/               # shadcn/ui コンポーネント
│       └── lib/
│           ├── platforms/        # 各プラットフォームAPI統合
│           │   ├── threads.ts    # ✅ 完了
│           │   ├── instagram.ts  # ✅ 完了
│           │   ├── youtube.ts    # ✅ 完了
│           │   └── x.ts          # ✅ 完了（オプション）
│           ├── supabase.ts       # ✅ 完了
│           └── types.ts          # ✅ 完了
├── workers/                      # Cloudflare Workers（未実装）
│   └── src/
│       ├── cron/                 # Cron Triggers
│       ├── posting/              # 投稿エンジン
│       └── auth/                 # トークンリフレッシュ
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql # ✅ 完了
└── docs/

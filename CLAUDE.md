# Social Harness — 完全開発仕様書

## 最終更新: 2026-04-01

---

## 0. このドキュメントの使い方

このドキュメントは Social Harness の開発全体を Claude Code が自律的に進めるための仕様書である。
各 Phase は順番に実装すること。各 Step 完了後に git commit し、Step 間の依存関係を壊さないこと。
不明点がある場合は推測で進めず、ユーザーに確認すること。

---

## 1. プロジェクト概要

### 1.1 何を作るか
Instagram / YouTube / Threads の3プラットフォームを1つの管理画面で運用するOSSのSNSマーケティングプラットフォーム。
オプションで X（Twitter）連携も可能（クライアントがAPI費用を負担する形）。

### 1.2 ビジネスモデル
OSSとして公開し、デプロイ・初期設定・保守を受託サービスとして提供（LINE Harnessと同じモデル）。

### 1.3 運営主体
株式会社 No Side（代表: だいすけ）

### 1.4 関連プロダクト
- LINE Harness (line-harness-oss): LINE CRM統合管理システム。Social HarnessとはトラッキングURLで緩く連携する（コードベースは完全に別）。
- RESIST Dashboard (resist-dashboard): パーソナルジムKPIダッシュボード。技術スタックの参考。

---

## 2. 技術スタック（確定）

| レイヤー | 技術 | 備考 |
|----------|------|------|
| フロントエンド | Next.js 16 App Router | TypeScript, src/ ディレクトリ使用 |
| CSS | Tailwind CSS | shadcn/ui コンポーネント使用 |
| UIコンポーネント | shadcn/ui | components/ui/ に配置済み |
| グラフ | Recharts | npm install recharts 済み |
| 日付処理 | date-fns | npm install date-fns 済み |
| APIレイヤー | Cloudflare Workers | Cron Triggers で定期実行 |
| DB | Supabase (PostgreSQL) | RLS によるマルチテナント |
| ファイルストレージ | Supabase Storage | 動画・画像の一時保管 |
| AI | Anthropic API (claude-sonnet-4-6) | 投稿提案・分析コメント生成 |
| デプロイ(Web) | Vercel | Next.js ホスティング |
| デプロイ(Workers) | Cloudflare | wrangler CLI |

---

## 3. インフラ情報

### Supabase
- プロジェクトID: lcisydaplexmehwxopdz
- URL: https://lcisydaplexmehwxopdz.supabase.co
- 既存テーブル: RESIST関連（gyms, kpi_monthly, reviews 等）。Social Harness のテーブルとは衝突しない。

### GitHub
- リポジトリ: daisukeishioka-pixel/social-harness-oss
- Git設定: user.name="daisuke" / user.email="daisuke.ishioka@noside-official.com"

### Meta Developer
- アプリ名:「Threads Analytics Pro」（Social Harnessに統合予定）
- 設定済み権限: threads_basic, threads_content_publish, threads_manage_insights
- 追加必要: Instagram Graph API のプロダクト追加、instagram_basic, instagram_manage_insights, instagram_content_publish, pages_show_list 権限

### Anthropic
- モデル: claude-sonnet-4-6（日常タスク・投稿生成用）

---

## 4. ディレクトリ構成（最終形）

```
social-harness-oss/
├── CLAUDE.md                              # この開発仕様書
├── README.md                              # プロジェクト概要（公開用）
├── LICENSE                                # MIT License
├── .env.example                           # 環境変数テンプレート
│
├── web/                                   # Next.js フロントエンド
│   └── src/
│       ├── app/
│       │   ├── layout.tsx                 # ルートレイアウト（lang="ja"）
│       │   ├── page.tsx                   # ランディングページ
│       │   ├── api/
│       │   │   ├── auth/
│       │   │   │   ├── threads/callback/route.ts    # 実装済み
│       │   │   │   ├── instagram/callback/route.ts  # 実装済み
│       │   │   │   └── youtube/callback/route.ts    # Phase1 Step2
│       │   │   ├── insights/route.ts                # Phase2 Step7
│       │   │   ├── posts/
│       │   │   │   ├── route.ts                     # Phase3 Step8
│       │   │   │   └── publish/route.ts             # Phase3 Step9
│       │   │   └── ai/suggest/route.ts              # Phase4 Step11
│       │   └── dashboard/
│       │       ├── layout.tsx                       # 実装済み
│       │       ├── page.tsx                         # シェル済み→Phase1 Step3で完成
│       │       ├── posts/page.tsx                   # Phase3 Step8
│       │       ├── scheduler/page.tsx               # Phase3 Step8
│       │       └── settings/page.tsx                # Phase5 Step13
│       ├── components/
│       │   ├── ui/                                  # shadcn/ui
│       │   └── dashboard/
│       │       ├── platform-connect-card.tsx         # 実装済み
│       │       ├── metric-card.tsx                   # 実装済み
│       │       ├── performance-chart.tsx             # Phase1 Step3
│       │       ├── follower-chart.tsx                # Phase1 Step3
│       │       ├── engagement-bar-chart.tsx          # Phase1 Step3
│       │       ├── post-performance-table.tsx        # Phase2 Step7
│       │       ├── scheduler-calendar.tsx            # Phase3 Step8
│       │       ├── post-composer.tsx                 # Phase3 Step8
│       │       ├── ai-suggestion-card.tsx            # Phase4 Step11
│       │       └── line-tracking-settings.tsx        # Phase4 Step12
│       └── lib/
│           ├── supabase.ts                          # 実装済み
│           ├── types.ts                             # 実装済み
│           ├── mock-data.ts                         # Phase1 Step3
│           └── platforms/
│               ├── index.ts                         # 実装済み
│               ├── threads.ts                       # 実装済み
│               ├── instagram.ts                     # 実装済み
│               ├── youtube.ts                       # 実装済み
│               └── x.ts                             # 実装済み（オプション）
│
├── workers/                                # Cloudflare Workers
│   ├── wrangler.toml                       # Phase2 Step5
│   ├── package.json                        # Phase2 Step5
│   └── src/
│       ├── index.ts                        # エントリーポイント
│       ├── cron/
│       │   ├── collect-insights.ts         # Phase2 Step5
│       │   ├── collect-account-metrics.ts  # Phase2 Step5
│       │   └── refresh-tokens.ts           # Phase2 Step6
│       ├── posting/
│       │   └── publish-scheduled.ts        # Phase3 Step9
│       └── lib/
│           ├── supabase.ts                 # Workers用クライアント
│           └── platforms.ts                # API関数の軽量コピー
│
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql          # 実装済み
│
└── docs/
    └── setup-guide.md                      # Phase5 Step14
```

---

## 5. データベーススキーマ

スキーマは supabase/migrations/001_initial_schema.sql に定義済み。

| テーブル | 役割 |
|----------|------|
| tenants | クライアント情報（会社名・プラン・契約状況） |
| platform_accounts | SNSアカウント（プラットフォーム種別・OAuthトークン・有効期限） |
| posts | 投稿データ（各プラットフォームから取得した投稿情報） |
| insights_snapshots | インサイト時系列データ（投稿別・1時間ごと蓄積） |
| account_metrics | アカウントレベル指標（フォロワー数・リーチ・日次推移） |
| scheduled_posts | 予約投稿キュー（実行日時・ステータス・クロスポスト先） |
| ai_suggestions | AI提案履歴（提案内容・採用/却下・結果フィードバック） |

型定義:
- platform_type ENUM: 'instagram', 'youtube', 'threads', 'x'
- post_status ENUM: 'draft', 'scheduled', 'publishing', 'published', 'failed'

テナント分離: 全テーブルに tenant_id カラム。RLS + JWTクレームでフィルタリング。Workers は service_role キーで RLS バイパス。

---

## 6. プラットフォームAPI仕様

### Instagram Graph API (v22.0)
- 認証: Facebook Login OAuth 2.0 → Pages API → IG Business Account ID取得
- トークン寿命: 短期1時間 → 長期60日（リフレッシュ可能）
- レート制限: 200コール/時/アプリ
- 投稿: Container作成 → Publish（2ステップ）
- インサイト: impressions, reach, likes, comments, shares, saved（メディア別）。follower_count, profile_views（アカウント別）

### Threads API (v1.0)
- 認証: Threads OAuth 2.0（Instagramとは別フロー）
- トークン寿命: 短期 → 長期60日（th_exchange_tokenでリフレッシュ）
- レート制限: 250投稿/24時間
- 投稿: Container作成 → Publish（2ステップ）
- インサイト: views, likes, replies, reposts, quotes, shares（メディア別）、followers_count（ユーザー別）

### YouTube Data API v3 + Analytics API
- 認証: Google OAuth 2.0（refresh_token付き、期限なし）
- クォータ: 10,000ユニット/日（動画アップロード1回=1,600ユニット）
- 投稿: videos.insert（resumable upload）
- インサイト: viewCount, likeCount, commentCount（Data API）。日別詳細（Analytics API）

### X API v2（オプション）
- 認証: OAuth 2.0 PKCE
- 費用: Basic $200/月〜（クライアント負担）
- APIキーの保管: platform_accounts.metadata のJSONBフィールド（環境変数ではない）
- 投稿: POST /2/tweets
- インサイト: public_metrics（いいね, RT, リプライ, 引用）

---

## 7. 開発フェーズ詳細

### Phase 1: 基盤構築（目安1週間）

#### Step 1: Supabaseスキーマ投入
- supabase MCP の list_tables で既存テーブル確認
- 001_initial_schema.sql を execute_sql で実行（大きければCREATE TABLEごとに分割）
- 完了後に list_tables で7テーブル + ビュー確認

#### Step 2: YouTube OAuth callback
- ファイル: web/src/app/api/auth/youtube/callback/route.ts
- Threads/Instagramと同じパターン
- exchangeYouTubeCode() → getYouTubeChannel() → platform_accounts に upsert
- YouTube固有: refresh_token を metadata.refresh_token に格納（Metaと違って別管理）
- リダイレクト先: /dashboard?connected=youtube

#### Step 3: ダッシュボードRechartsグラフ
- web/src/lib/mock-data.ts を作成。過去30日〜90日のダミーデータ生成関数
- web/src/components/dashboard/performance-chart.tsx: AreaChart（リーチ推移、3プラットフォーム線）
- web/src/components/dashboard/follower-chart.tsx: LineChart（フォロワー推移、90日）
- web/src/components/dashboard/engagement-bar-chart.tsx: BarChart（投稿別エンゲージメント率、直近10投稿）
- dashboard/page.tsx 更新: Tabs内にグラフ配置、MetricCardの値をモックデータ集計値に

#### Step 4: Vercelデプロイ
- cd web && vercel --prod
- 環境変数設定
- OAuth callback URLをVercelドメインに変更

---

### Phase 2: データ収集パイプライン（目安1-2週間）

#### Step 5: Cloudflare Workers Cron
- workers/ に Cloudflare Workers プロジェクト構築
- wrangler.toml: crons = ["0 * * * *"(毎時), "0 3 * * *"(毎日3時), "0 6 * * 1"(毎週月曜)]
- collect-insights.ts: 全アクティブアカウントの最新25投稿のインサイトを取得→insights_snapshotsにUPSERT
- collect-account-metrics.ts: アカウントレベル指標を取得→account_metricsにUPSERT
- レート制限考慮: APIコール間にwait。エラーは個別catch（1アカウントの失敗で他を止めない）

#### Step 6: トークンリフレッシュ自動化
- refresh-tokens.ts: token_expires_atが7日以内のアカウントを自動リフレッシュ
- Instagram/Threads: 長期トークンリフレッシュ
- YouTube: refresh_tokenでアクセストークン再取得（refresh_token自体は不変）
- X: クライアント側の責任（managed_by_client = true）
- 3回連続失敗で is_active = false

#### Step 7: ダッシュボードをリアルデータに切替
- web/src/app/api/insights/route.ts: v_post_performance + account_metrics からデータ取得
- ダッシュボード: データあり→リアルデータ、なし→モック or 接続案内表示
- post-performance-table.tsx: 投稿一覧テーブル（ソート・フィルタ機能）

---

### Phase 3: 投稿機能（目安1-2週間）

#### Step 8: 投稿スケジューラーUI
- scheduler/page.tsx: カレンダービュー（月表示、日ごとの投稿ドット）
- post-composer.tsx: キャプション入力、画像/動画アップロード、プラットフォーム選択チェックボックス、日時ピッカー、ハッシュタグ入力
- プラットフォーム別制約をUIに反映: IG(画像必須/2200字), Threads(500字), YT(動画必須), X(280字)
- api/posts/route.ts: scheduled_posts テーブルへのCRUD
- posts/page.tsx: 投稿一覧（ステータス・プラットフォーム別フィルタ）

#### Step 9: 投稿エンジン（Workers）
- publish-scheduled.ts: scheduled_at <= now() の投稿を取得→各プラットフォームAPIで投稿
- ステータス管理: scheduled → publishing → published/failed
- 部分成功対応（3プラットフォーム中2つ成功した場合も記録）
- 成功した投稿はpostsテーブルにもINSERT（インサイト収集対象にする）

#### Step 10: クロスポスト最適化
- web/src/lib/cross-post.ts: プラットフォーム別にコンテンツを自動調整
- adaptForInstagram(): 画像必須チェック、2200字トリム、ハッシュタグ末尾追加
- adaptForThreads(): 500字トリム、メディア判定
- adaptForYouTube(): 動画必須チェック、タイトル100字+説明5000字分割
- adaptForX(): 280字トリム（URL23字換算）

---

### Phase 4: AI + LINE連携（目安2-3週間）

#### Step 11: AI投稿提案
- api/ai/suggest/route.ts: Anthropic API呼び出し
- 入力: 直近10投稿のパフォーマンスデータ + Top5投稿 + 業種 + トーン
- 出力: 3つの投稿提案（キャプション案 + ハッシュタグ案）
- ai_suggestions テーブルに記録
- ai-suggestion-card.tsx: 採用→PostComposerに流し込み、却下→ステータス更新
- フィードバックループ: 採用した提案の投稿パフォーマンスを自動記録

#### Step 12: LINE Harness連携
- LINE Harnessとの連携はコードベース統合ではない。トラッキングURLの規約を共有する緩い連携。
- line-tracking-settings.tsx: LINE公式アカウントURL入力、UTMパラメータ自動生成
  - Instagram用: {LINE_URL}?utm_source=instagram&utm_medium=social&utm_campaign={name}
  - YouTube用: {LINE_URL}?utm_source=youtube&utm_medium=social&utm_campaign={name}
  - Threads用: {LINE_URL}?utm_source=threads&utm_medium=social&utm_campaign={name}
- PostComposerに「LINE導線リンクを挿入」チェックボックス追加
- ダッシュボードに「LINE登録経路」セクション（MVP段階ではURL生成・挿入まで）

---

### Phase 5: 受託展開準備

#### Step 13: マルチテナント認証
- Supabase Auth（メール/パスワード認証）
- JWT に tenant_id クレーム付与
- settings/page.tsx: アカウント設定、プラットフォーム接続管理、X APIキー入力、LINE導線設定

#### Step 14: ドキュメント整備
- docs/setup-guide.md: 前提条件、Meta/Google/Supabase/Cloudflare/Vercelの設定手順、環境変数一覧、トラブルシューティング

---

## 8. コーディング規約

- TypeScript strict モード。any 禁止。
- ファイル命名: kebab-case.tsx / kebab-case.ts
- コミットメッセージ: "Phase1 Step3: Add Recharts dashboard charts with mock data" の形式
- エラーハンドリング: 全API呼び出しはtry-catch。Workersは個別catch。
- セキュリティ: service_role キーはフロントに露出させない。X APIキーはmetadataに格納。

---

## 9. デプロイチェックリスト

### Vercel
- 環境変数設定（.env.exampleの全項目）
- OAuth callback URLにVercelドメインを設定
- Meta Developer App の Valid OAuth Redirect URIs にVercelドメイン追加

### Cloudflare Workers
- wrangler secret put SUPABASE_SERVICE_ROLE_KEY
- wrangler secret put META_APP_SECRET
- wrangler secret put GOOGLE_CLIENT_SECRET
- wrangler deploy
- Cron Triggers 登録確認

### Supabase
- スキーマ投入完了（7テーブル + 1ビュー）
- RLSポリシー適用確認
- テスト用テナントデータのINSERT

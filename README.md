# Social Harness

**SNS統合管理プラットフォーム** — Instagram, YouTube, Threads を一元管理。投稿・分析・AIアシスタントを統合したオープンソースのSNSマーケティングツール。

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## 概要

Social Harness は、複数のSNSプラットフォームを1つの管理画面で運用するためのオープンソースプラットフォームです。

### コア対応プラットフォーム（APIコスト無料）

| Platform | 投稿 | インサイト分析 | 予約投稿 |
|----------|------|---------------|---------|
| **Instagram** | 写真・動画・リール・カルーセル・ストーリーズ | リーチ・エンゲージメント・デモグラフィクス | ✅ |
| **YouTube** | 動画アップロード・メタデータ編集 | 視聴回数・いいね・コメント・CTR | ✅ |
| **Threads** | テキスト・画像・動画・リンク | views・いいね・リプライ・リポスト・引用・クリック | ✅ |

### オプション（クライアントがAPI費用を負担）

| Platform | 条件 |
|----------|------|
| **X (Twitter)** | クライアントが X Developer Portal で Basic ($200/月〜) を契約し、APIキーを管理画面に入力 |

## 技術スタック

| レイヤー | 技術 |
|----------|------|
| フロントエンド | Next.js App Router + Tailwind CSS + shadcn/ui + Recharts |
| APIレイヤー | Cloudflare Workers（Cron Triggers・投稿エンジン・トークン管理） |
| データベース | Supabase（PostgreSQL + Row Level Security） |
| ファイルストレージ | Supabase Storage / Cloudflare R2 |
| AI | Anthropic API（claude-sonnet-4-6） |
| デプロイ | Vercel（Next.js）+ Cloudflare（Workers） |

## 機能

### 統合ダッシュボード
全プラットフォームのフォロワー推移・エンゲージメント率・リーチを一画面で可視化。

### 投稿スケジューラー
カレンダーUIで投稿を予約。同一コンテンツを複数プラットフォームに同時投稿するクロスポスト機能対応。

### インサイト自動収集
1時間ごとにCloudflare Workers のCron Triggerが各プラットフォームのAPIをポーリングし、Supabaseに時系列データとして蓄積。

### AIアシスタント
過去のパフォーマンスデータを元に「次に何を投稿すべきか」を提案。投稿文・ハッシュタグの自動生成、パフォーマンス分析コメントの自動付与。

### LINE Harness 連携（オプション）
[LINE Harness](https://github.com/daisukeishioka-pixel/line-harness-oss) と連携し、SNSからLINE公式アカウントへの転換導線を設計・計測。

## セットアップ

### 前提条件

- Node.js 18+
- Supabase アカウント
- Cloudflare アカウント（Workers + Cron Triggers）
- Vercel アカウント
- Meta Developer アカウント（Instagram + Threads）
- Google Cloud プロジェクト（YouTube Data API v3）
- Anthropic API キー

### 1. リポジトリをクローン

```bash
git clone https://github.com/daisukeishioka-pixel/social-harness-oss.git
cd social-harness-oss
```

### 2. Supabase セットアップ

```bash
# Supabase CLIでマイグレーション実行
supabase db push
```

### 3. 環境変数を設定

```bash
cp .env.example .env.local
```

必要な環境変数：

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Meta (Instagram + Threads)
META_APP_ID=your-meta-app-id
META_APP_SECRET=your-meta-app-secret

# Google (YouTube)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Anthropic
ANTHROPIC_API_KEY=your-anthropic-api-key

# X (Optional)
X_API_KEY=client-provided
X_API_SECRET=client-provided
```

### 4. 開発サーバー起動

```bash
cd web
npm install
npm run dev
```

## プロジェクト構成

```
social-harness-oss/
├── web/                    # Next.js フロントエンド
│   └── src/
│       ├── app/            # App Router pages
│       ├── components/     # UI components
│       └── lib/            # Supabase client, utils
├── workers/                # Cloudflare Workers
│   └── src/
│       ├── cron/           # Cron Triggers (insights polling)
│       ├── posting/        # 投稿エンジン
│       └── auth/           # OAuth token management
├── supabase/
│   └── migrations/         # SQL migrations
├── docs/                   # ドキュメント
└── README.md
```

## ビジネスモデル

Social Harness はオープンソース（MIT License）です。どなたでも自由にデプロイ・利用できます。

株式会社 No Side では、以下の受託サービスを提供しています：

| サービス | 内容 |
|----------|------|
| **初期構築** | OAuth設定・ダッシュボード構築・初期データ連携 |
| **月額保守** | API監視・トークン管理・障害対応・機能アップデート |
| **X連携オプション** | X API統合構築（API費用はクライアント負担） |
| **LINE Harness連携** | SNS → LINE 導線設計・トラッキング・コンバージョン分析 |

お問い合わせ: [株式会社 No Side](https://noside-official.com)

## ライセンス

MIT License — 詳細は [LICENSE](LICENSE) を参照してください。

## 関連プロジェクト

- [LINE Harness](https://github.com/daisukeishioka-pixel/line-harness-oss) — LINE CRM 統合管理システム
- [RESIST Dashboard](https://github.com/daisukeishioka-pixel/resist-dashboard) — パーソナルジム KPI ダッシュボード

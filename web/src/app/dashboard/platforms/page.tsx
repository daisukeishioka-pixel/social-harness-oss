"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PLATFORM_CONFIG, type PlatformType } from "@/lib/types";

interface PlatformInfo {
  platform: PlatformType;
  description: string;
  features: string[];
  limits: string;
  setupSteps: { title: string; detail: string }[];
  optional?: boolean;
}

const PLATFORMS: PlatformInfo[] = [
  {
    platform: "instagram",
    description:
      "写真・動画・リール・カルーセル・ストーリーズの投稿とインサイト分析",
    features: [
      "写真・動画・リール投稿",
      "インプレッション・リーチ・エンゲージメント分析",
      "フォロワー推移トラッキング",
      "ハッシュタグ最適化",
    ],
    limits: "キャプション2,200文字 / 画像必須 / ハッシュタグ最大30個",
    setupSteps: [
      {
        title: "1. Meta Developer アカウントを作成",
        detail:
          "developers.facebook.com にアクセスし、Facebookアカウントでログイン。まだアカウントがない場合は「スタート」から開発者登録を完了してください。",
      },
      {
        title: "2. アプリを作成",
        detail:
          'My Apps > Create App を選択。アプリタイプは「Business」を選び、アプリ名を入力して作成します。',
      },
      {
        title: "3. Instagram Graph API を追加",
        detail:
          'アプリダッシュボードの Products から「Instagram Graph API」を探して Set Up をクリック。必要な権限（instagram_basic, instagram_manage_insights, instagram_content_publish, pages_show_list）を追加します。',
      },
      {
        title: "4. OAuth リダイレクト URI を設定",
        detail:
          "App Settings > Basic の Valid OAuth Redirect URIs に以下を追加:\nhttps://あなたのドメイン/api/auth/instagram/callback",
      },
      {
        title: "5. Social Harness で接続",
        detail:
          '下の「アカウントを接続」ボタンをクリックすると、Instagram ビジネスアカウントとの連携が開始されます。Facebookページに紐付いたInstagram ビジネスアカウントが必要です。',
      },
    ],
  },
  {
    platform: "youtube",
    description: "動画アップロード・メタデータ編集・視聴分析",
    features: [
      "動画アップロード（Resumable Upload）",
      "視聴回数・いいね・コメント分析",
      "YouTube Analytics 詳細データ",
      "チャンネル登録者推移",
    ],
    limits:
      "タイトル100文字 / 説明5,000文字 / API クォータ 10,000ユニット/日",
    setupSteps: [
      {
        title: "1. Google Cloud プロジェクトを作成",
        detail:
          "console.cloud.google.com にアクセスし、新しいプロジェクトを作成します。プロジェクト名は任意です。",
      },
      {
        title: "2. YouTube API を有効化",
        detail:
          "APIs & Services > Library から「YouTube Data API v3」と「YouTube Analytics API」をそれぞれ検索して有効化します。",
      },
      {
        title: "3. OAuth 同意画面を設定",
        detail:
          "APIs & Services > OAuth consent screen で External を選択。スコープに youtube.readonly, youtube.upload, yt-analytics.readonly を追加します。",
      },
      {
        title: "4. OAuth クライアントを作成",
        detail:
          "Credentials > Create Credentials > OAuth client ID を選択。Application type は「Web application」。Authorized redirect URIs に以下を追加:\nhttps://あなたのドメイン/api/auth/youtube/callback",
      },
      {
        title: "5. Social Harness で接続",
        detail:
          '下の「アカウントを接続」ボタンをクリックすると、Google アカウント認証画面に遷移します。YouTube チャンネルを持つアカウントで認証してください。',
      },
    ],
  },
  {
    platform: "threads",
    description: "テキスト・画像・動画・リンク投稿とインサイト分析",
    features: [
      "テキスト・画像・動画投稿",
      "閲覧数・いいね・リプライ・リポスト分析",
      "フォロワー数トラッキング",
      "引用・シェア数計測",
    ],
    limits: "キャプション500文字 / 250投稿/24時間",
    setupSteps: [
      {
        title: "1. Meta Developer でアプリを準備",
        detail:
          "Instagram と同じ Meta アプリを使用できます。まだアプリがない場合は developers.facebook.com で作成してください。",
      },
      {
        title: "2. Threads API を追加",
        detail:
          'アプリダッシュボードの Products から「Threads API」を探して Set Up をクリック。権限（threads_basic, threads_content_publish, threads_manage_insights）を追加します。',
      },
      {
        title: "3. OAuth リダイレクト URI を設定",
        detail:
          "Threads API の設定画面で Valid OAuth Redirect URIs に以下を追加:\nhttps://あなたのドメイン/api/auth/threads/callback",
      },
      {
        title: "4. Social Harness で接続",
        detail:
          '下の「アカウントを接続」ボタンをクリックすると、Threads アカウント認証が開始されます。Instagram とは別のOAuthフローです。',
      },
    ],
  },
  {
    platform: "tiktok",
    description: "ショート動画アップロード・再生数・エンゲージメント分析",
    features: [
      "動画アップロード（Content Posting API）",
      "再生数・いいね・コメント・シェア分析",
      "動画一覧取得",
      "ユーザー統計情報",
    ],
    limits: "動画必須 / キャプション2,200文字 / access_token 24時間有効",
    setupSteps: [
      {
        title: "1. TikTok Developer アカウントを作成",
        detail:
          "developers.tiktok.com にアクセスし、TikTok アカウントでログイン。Developer として登録します。",
      },
      {
        title: "2. アプリを作成",
        detail:
          "Manage Apps > Create から新しいアプリを作成。必要なスコープ（user.info.basic, user.info.stats, video.list, video.publish, video.upload）を選択します。",
      },
      {
        title: "3. リダイレクト URI を設定",
        detail:
          "アプリ設定の Redirect URI に以下を追加:\nhttps://あなたのドメイン/api/auth/tiktok/callback",
      },
      {
        title: "4. Social Harness で接続",
        detail:
          '下の「アカウントを接続」ボタンをクリックすると、TikTok ログイン画面に遷移します。',
      },
    ],
  },
  {
    platform: "x",
    description: "ツイート投稿・いいね/RT/リプライ分析（有料プラン必要）",
    features: [
      "ツイート投稿（POST /2/tweets）",
      "いいね・RT・リプライ・引用の分析",
      "パブリックメトリクス取得",
    ],
    limits: "280文字（URL は23文字換算）/ Basic $200/月〜必要",
    optional: true,
    setupSteps: [
      {
        title: "1. X Developer Portal に登録",
        detail:
          "developer.x.com にアクセスし、開発者アカウントを申請します。Basic プラン（$200/月〜）への加入が必要です。",
      },
      {
        title: "2. アプリを作成して API キーを取得",
        detail:
          "Projects & Apps からアプリを作成し、以下の4つのキーを取得します:\n・API Key\n・API Secret\n・Access Token\n・Access Token Secret",
      },
      {
        title: "3. Social Harness に API キーを入力",
        detail:
          '設定画面の「X APIキー」タブで取得したキーを入力して保存します。X は他のプラットフォームと異なり、OAuth フローではなく API キーの直接入力方式です。',
      },
    ],
  },
];

export default function PlatformsPage() {
  const [expanded, setExpanded] = useState<string | null>(null);

  const handleConnect = (platform: PlatformType) => {
    const origin = window.location.origin;
    switch (platform) {
      case "instagram":
        window.location.href = `${origin}/api/auth/instagram/connect`;
        break;
      case "threads":
        window.location.href = `${origin}/api/auth/threads/connect`;
        break;
      case "youtube":
        window.location.href = `${origin}/api/auth/youtube/connect`;
        break;
      case "tiktok":
        window.location.href = `${origin}/api/auth/tiktok/connect`;
        break;
      case "x":
        window.location.href = "/dashboard/settings?tab=x";
        break;
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">
          プラットフォーム接続
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          SNSアカウントを接続して、投稿・分析・予約投稿を一元管理できます
        </p>
      </div>

      <div className="space-y-4">
        {PLATFORMS.map((p) => {
          const config = PLATFORM_CONFIG[p.platform];
          const isExpanded = expanded === p.platform;

          return (
            <Card key={p.platform}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                      style={{ backgroundColor: config.color }}
                    >
                      {config.label[0]}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base">
                          {config.label}
                        </CardTitle>
                        {p.optional && (
                          <Badge
                            variant="outline"
                            className="text-[10px] text-gray-400"
                          >
                            オプション（有料）
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {p.description}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleConnect(p.platform)}
                    className="shrink-0 rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700 transition-colors"
                  >
                    {p.platform === "x" ? "APIキーを設定" : "アカウントを接続"}
                  </button>
                </div>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                {/* Features & Limits */}
                <div className="flex flex-wrap gap-2">
                  {p.features.map((f) => (
                    <span
                      key={f}
                      className="rounded-full px-2.5 py-1 text-[11px] font-medium"
                      style={{
                        backgroundColor: config.bgColor,
                        color: config.color,
                      }}
                    >
                      {f}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-gray-400">制限: {p.limits}</p>

                {/* Setup guide toggle */}
                <button
                  onClick={() =>
                    setExpanded(isExpanded ? null : p.platform)
                  }
                  className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
                >
                  <svg
                    className={`w-3.5 h-3.5 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                  設定ガイドを{isExpanded ? "閉じる" : "表示"}
                </button>

                {/* Step-by-step guide */}
                {isExpanded && (
                  <div className="rounded-lg bg-gray-50 p-4 space-y-4">
                    <p className="text-xs font-semibold text-gray-700">
                      {config.label} の接続手順
                    </p>
                    <div className="space-y-3">
                      {p.setupSteps.map((step, i) => (
                        <div key={i} className="flex gap-3">
                          <div
                            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white mt-0.5"
                            style={{ backgroundColor: config.color }}
                          >
                            {i + 1}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-800">
                              {step.title.replace(/^\d+\.\s*/, "")}
                            </p>
                            <p className="text-xs text-gray-500 mt-1 whitespace-pre-line leading-relaxed">
                              {step.detail}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

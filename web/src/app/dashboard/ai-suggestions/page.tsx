"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AiSuggestionCard } from "@/components/dashboard/ai-suggestion-card";

interface Suggestion {
  id?: string;
  content: string;
  platform?: string | null;
  hashtags?: string[];
  reasoning?: string;
  status: string;
}

// Mock suggestions for display before API connection
const MOCK_SUGGESTIONS: Suggestion[] = [
  {
    id: "mock-1",
    content:
      "春の訪れとともに、新しいチャレンジを始めませんか？\n\n私たちのサービスがあなたの第一歩をサポートします。今なら初回無料相談を実施中！",
    platform: "instagram",
    hashtags: ["#春スタート", "#新生活", "#無料相談", "#ブランディング"],
    reasoning: "季節性トピックは過去データでER +40%の傾向",
    status: "pending",
  },
  {
    id: "mock-2",
    content:
      "知ってましたか？SNSマーケティングで成果を出している企業の87%が「一貫したブランドストーリー」を持っています。\n\nあなたのブランドストーリー、言語化できていますか？",
    platform: "threads",
    hashtags: ["#SNSマーケティング", "#ブランドストーリー", "#マーケティング戦略"],
    reasoning: "質問形式の投稿はThreadsでのリプライ率が高い",
    status: "pending",
  },
  {
    id: "mock-3",
    content:
      "【保存版】2026年に押さえておくべきSNSトレンド5選\n\n1. ショート動画のさらなる台頭\n2. AIパーソナライゼーション\n3. コミュニティ重視の運用\n4. UGC活用の進化\n5. ソーシャルコマースの拡大",
    platform: "tiktok",
    hashtags: ["#SNSトレンド", "#2026年", "#マーケティング", "#ソーシャルメディア"],
    reasoning: "リスト形式のコンテンツはTop5投稿の共通パターン",
    status: "pending",
  },
];

export default function AiSuggestionsPage() {
  const [suggestions, setSuggestions] =
    useState<Suggestion[]>(MOCK_SUGGESTIONS);
  const [loading, setLoading] = useState(false);
  const [industry, setIndustry] = useState("");
  const [tone, setTone] = useState("プロフェッショナル");

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_id: "demo", // TODO: get from auth context
          industry,
          tone,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setSuggestions(data.suggestions);
      }
    } catch {
      // Keep mock data on error
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = (suggestion: Suggestion) => {
    // Navigate to scheduler with pre-filled content
    const params = new URLSearchParams({
      caption: suggestion.content,
      hashtags: (suggestion.hashtags || []).join(","),
      platform: suggestion.platform || "",
    });
    window.location.href = `/dashboard/scheduler?${params}`;
  };

  const handleReject = async (id: string) => {
    try {
      await fetch("/api/ai/suggest", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "rejected" }),
      });
    } catch {
      // Silent fail for status update
    }
    setSuggestions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: "rejected" } : s))
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">AI投稿提案</h2>
        <p className="text-sm text-gray-500 mt-1">
          過去の投稿データを分析して、効果的な投稿を提案します
        </p>
      </div>

      {/* Generation controls */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">提案を生成</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                業種
              </label>
              <input
                type="text"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="例: アパレル、飲食、IT"
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 w-48"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                トーン
              </label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="プロフェッショナル">プロフェッショナル</option>
                <option value="カジュアル">カジュアル</option>
                <option value="フレンドリー">フレンドリー</option>
                <option value="フォーマル">フォーマル</option>
                <option value="ユーモラス">ユーモラス</option>
              </select>
            </div>
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              {loading ? (
                <>
                  <svg
                    className="w-4 h-4 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  生成中...
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                  AIに提案を依頼
                </>
              )}
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Suggestions */}
      <div className="grid gap-4 md:grid-cols-3">
        {suggestions.map((s, i) => (
          <AiSuggestionCard
            key={s.id || i}
            suggestion={s}
            onAccept={() => handleAccept(s)}
            onReject={handleReject}
          />
        ))}
      </div>

      {suggestions.length === 0 && (
        <div className="text-center py-12 text-sm text-gray-400">
          「AIに提案を依頼」ボタンを押すと、投稿提案が生成されます
        </div>
      )}
    </div>
  );
}

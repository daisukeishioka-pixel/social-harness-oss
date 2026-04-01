"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const PLATFORM_LABELS: Record<string, { label: string; color: string }> = {
  instagram: { label: "Instagram", color: "bg-pink-100 text-pink-700" },
  youtube: { label: "YouTube", color: "bg-red-100 text-red-700" },
  threads: { label: "Threads", color: "bg-gray-100 text-gray-700" },
  tiktok: { label: "TikTok", color: "bg-cyan-100 text-cyan-700" },
  x: { label: "X", color: "bg-blue-100 text-blue-700" },
};

interface PostPerformance {
  post_id: string;
  platform: string;
  caption: string | null;
  published_at: string | null;
  impressions: number | null;
  reach: number | null;
  views: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  engagement_rate: number | null;
}

type SortKey = "published_at" | "impressions" | "reach" | "likes" | "engagement_rate";

// Mock data for display before real data is available
const MOCK_POSTS: PostPerformance[] = [
  {
    post_id: "1",
    platform: "instagram",
    caption: "新商品のご紹介！春の限定コレクション🌸",
    published_at: "2026-03-28T10:00:00Z",
    impressions: 6200,
    reach: 4800,
    views: null,
    likes: 420,
    comments: 35,
    shares: 18,
    engagement_rate: 0.0763,
  },
  {
    post_id: "2",
    platform: "youtube",
    caption: "【完全版】2026年春のトレンド解説",
    published_at: "2026-03-25T14:00:00Z",
    impressions: null,
    reach: null,
    views: 12500,
    likes: 890,
    comments: 67,
    shares: 45,
    engagement_rate: 0.0802,
  },
  {
    post_id: "3",
    platform: "threads",
    caption: "今日のチームミーティングで出た面白いアイデア。皆さんはどう思いますか？",
    published_at: "2026-03-30T09:30:00Z",
    impressions: null,
    reach: null,
    views: 3400,
    likes: 280,
    comments: 42,
    shares: 15,
    engagement_rate: 0.0991,
  },
  {
    post_id: "4",
    platform: "instagram",
    caption: "Behind the scenes: 撮影の裏側をお見せします📷",
    published_at: "2026-03-22T16:00:00Z",
    impressions: 4500,
    reach: 3200,
    views: null,
    likes: 310,
    comments: 22,
    shares: 12,
    engagement_rate: 0.0764,
  },
  {
    post_id: "5",
    platform: "threads",
    caption: "ブランドストーリーをリニューアルしました。新しいビジョンについて語ります。",
    published_at: "2026-03-20T11:00:00Z",
    impressions: null,
    reach: null,
    views: 2800,
    likes: 195,
    comments: 28,
    shares: 22,
    engagement_rate: 0.0875,
  },
  {
    post_id: "6",
    platform: "tiktok",
    caption: "朝のルーティン🌅 #morningroutine #生活",
    published_at: "2026-03-29T08:00:00Z",
    impressions: null,
    reach: null,
    views: 45000,
    likes: 3200,
    comments: 180,
    shares: 520,
    engagement_rate: 0.0867,
  },
];

interface Props {
  posts?: PostPerformance[];
}

export function PostPerformanceTable({ posts }: Props) {
  const data = posts && posts.length > 0 ? posts : MOCK_POSTS;
  const isUsingMock = !posts || posts.length === 0;

  const [sortKey, setSortKey] = useState<SortKey>("published_at");
  const [sortAsc, setSortAsc] = useState(false);
  const [filterPlatform, setFilterPlatform] = useState<string>("all");

  const filtered = useMemo(() => {
    let result = data;
    if (filterPlatform !== "all") {
      result = result.filter((p) => p.platform === filterPlatform);
    }
    return [...result].sort((a, b) => {
      const av = a[sortKey] ?? 0;
      const bv = b[sortKey] ?? 0;
      if (av < bv) return sortAsc ? -1 : 1;
      if (av > bv) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [data, sortKey, sortAsc, filterPlatform]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  };

  const sortIndicator = (key: SortKey) =>
    sortKey === key ? (sortAsc ? " ↑" : " ↓") : "";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">
            投稿パフォーマンス
            {isUsingMock && (
              <span className="ml-2 text-xs font-normal text-gray-400">
                (サンプルデータ)
              </span>
            )}
          </CardTitle>
          <div className="flex gap-1">
            {["all", "instagram", "youtube", "threads", "tiktok"].map((p) => (
              <button
                key={p}
                onClick={() => setFilterPlatform(p)}
                className={`rounded-md px-2 py-1 text-xs transition-colors ${
                  filterPlatform === p
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {p === "all" ? "全て" : PLATFORM_LABELS[p]?.label ?? p}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-gray-500">
                <th className="pb-2 pr-4 font-medium">投稿</th>
                <th className="pb-2 pr-4 font-medium">プラットフォーム</th>
                <th
                  className="cursor-pointer pb-2 pr-4 font-medium hover:text-gray-900"
                  onClick={() => handleSort("published_at")}
                >
                  日時{sortIndicator("published_at")}
                </th>
                <th
                  className="cursor-pointer pb-2 pr-4 text-right font-medium hover:text-gray-900"
                  onClick={() => handleSort("impressions")}
                >
                  IMP/Views{sortIndicator("impressions")}
                </th>
                <th
                  className="cursor-pointer pb-2 pr-4 text-right font-medium hover:text-gray-900"
                  onClick={() => handleSort("likes")}
                >
                  いいね{sortIndicator("likes")}
                </th>
                <th className="pb-2 pr-4 text-right font-medium">コメント</th>
                <th
                  className="cursor-pointer pb-2 text-right font-medium hover:text-gray-900"
                  onClick={() => handleSort("engagement_rate")}
                >
                  ER{sortIndicator("engagement_rate")}
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((post) => {
                const platformInfo = PLATFORM_LABELS[post.platform] ?? {
                  label: post.platform,
                  color: "bg-gray-100 text-gray-700",
                };
                return (
                  <tr
                    key={post.post_id}
                    className="border-b last:border-0 hover:bg-gray-50"
                  >
                    <td className="max-w-[200px] truncate py-3 pr-4">
                      {post.caption || "—"}
                    </td>
                    <td className="py-3 pr-4">
                      <Badge
                        variant="outline"
                        className={`text-xs ${platformInfo.color}`}
                      >
                        {platformInfo.label}
                      </Badge>
                    </td>
                    <td className="py-3 pr-4 text-gray-500">
                      {post.published_at
                        ? new Date(post.published_at).toLocaleDateString(
                            "ja-JP",
                            { month: "short", day: "numeric" }
                          )
                        : "—"}
                    </td>
                    <td className="py-3 pr-4 text-right tabular-nums">
                      {formatNum(post.impressions ?? post.views)}
                    </td>
                    <td className="py-3 pr-4 text-right tabular-nums">
                      {formatNum(post.likes)}
                    </td>
                    <td className="py-3 pr-4 text-right tabular-nums">
                      {formatNum(post.comments)}
                    </td>
                    <td className="py-3 text-right tabular-nums">
                      {post.engagement_rate != null
                        ? `${(post.engagement_rate * 100).toFixed(1)}%`
                        : "—"}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="py-8 text-center text-gray-400"
                  >
                    データがありません
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function formatNum(n: number | null | undefined): string {
  if (n == null) return "—";
  if (n >= 10000) return `${(n / 1000).toFixed(1)}K`;
  return n.toLocaleString();
}

"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PLATFORM_CONFIG, type PlatformType } from "@/lib/types";

type PostStatus = "draft" | "scheduled" | "publishing" | "published" | "failed";

interface ScheduledPost {
  id: string;
  caption: string | null;
  scheduled_at: string;
  status: PostStatus;
  target_platforms: Array<{ platform: PlatformType }>;
  created_at: string;
}

const STATUS_CONFIG: Record<
  PostStatus,
  { label: string; className: string }
> = {
  draft: { label: "下書き", className: "bg-gray-100 text-gray-600" },
  scheduled: { label: "予約済み", className: "bg-blue-100 text-blue-700" },
  publishing: { label: "投稿中", className: "bg-yellow-100 text-yellow-700" },
  published: { label: "投稿完了", className: "bg-green-100 text-green-700" },
  failed: { label: "失敗", className: "bg-red-100 text-red-700" },
};

const MOCK_POSTS: ScheduledPost[] = [
  {
    id: "1",
    caption: "春の新作コレクション発表！限定アイテムも多数ご用意しています🌸",
    scheduled_at: new Date(Date.now() + 2 * 86400000).toISOString(),
    status: "scheduled",
    target_platforms: [
      { platform: "instagram" },
      { platform: "threads" },
    ],
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "2",
    caption: "【完全ガイド】2026年SNS運用の最新トレンドを解説",
    scheduled_at: new Date(Date.now() + 5 * 86400000).toISOString(),
    status: "scheduled",
    target_platforms: [
      { platform: "youtube" },
      { platform: "tiktok" },
    ],
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: "3",
    caption: "チームの日常をお届け！オフィスツアー",
    scheduled_at: new Date(Date.now() - 86400000).toISOString(),
    status: "published",
    target_platforms: [
      { platform: "instagram" },
      { platform: "threads" },
      { platform: "tiktok" },
    ],
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: "4",
    caption: "お客様の声を紹介します✨",
    scheduled_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    status: "published",
    target_platforms: [{ platform: "instagram" }],
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: "5",
    caption: "週末限定キャンペーン！",
    scheduled_at: new Date(Date.now() + 1 * 86400000).toISOString(),
    status: "draft",
    target_platforms: [
      { platform: "instagram" },
      { platform: "threads" },
      { platform: "x" },
    ],
    created_at: new Date().toISOString(),
  },
];

export default function PostsPage() {
  const [statusFilter, setStatusFilter] = useState<PostStatus | "all">(
    "all"
  );
  const [platformFilter, setPlatformFilter] = useState<string>("all");

  const filtered = MOCK_POSTS.filter((post) => {
    if (statusFilter !== "all" && post.status !== statusFilter) return false;
    if (
      platformFilter !== "all" &&
      !post.target_platforms.some((tp) => tp.platform === platformFilter)
    )
      return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">投稿管理</h2>
        <p className="text-sm text-gray-500 mt-1">
          予約投稿の一覧と管理
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">ステータス:</span>
          <div className="flex gap-1">
            {(
              ["all", "draft", "scheduled", "published", "failed"] as const
            ).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  statusFilter === s
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {s === "all" ? "全て" : STATUS_CONFIG[s].label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">プラットフォーム:</span>
          <div className="flex gap-1">
            {["all", "instagram", "youtube", "threads", "tiktok", "x"].map(
              (p) => (
                <button
                  key={p}
                  onClick={() => setPlatformFilter(p)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                    platformFilter === p
                      ? "bg-gray-900 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {p === "all"
                    ? "全て"
                    : PLATFORM_CONFIG[p as PlatformType]?.label ?? p}
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {/* Post list */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {filtered.length}件の投稿
            <span className="ml-2 text-xs font-normal text-gray-400">
              (サンプルデータ)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y">
            {filtered.map((post) => {
              const statusInfo = STATUS_CONFIG[post.status];
              return (
                <div
                  key={post.id}
                  className="flex items-start gap-4 py-4 first:pt-0 last:pb-0"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {post.caption || "無題"}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${statusInfo.className}`}
                      >
                        {statusInfo.label}
                      </Badge>
                      {post.target_platforms.map((tp) => {
                        const config =
                          PLATFORM_CONFIG[tp.platform];
                        return (
                          <span
                            key={tp.platform}
                            className="inline-flex items-center gap-1 text-[10px] text-gray-500"
                          >
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{
                                backgroundColor: config?.color || "#888",
                              }}
                            />
                            {config?.label || tp.platform}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-gray-500">
                      {new Date(post.scheduled_at).toLocaleDateString(
                        "ja-JP",
                        {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </p>
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && (
              <div className="py-8 text-center text-sm text-gray-400">
                該当する投稿がありません
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PlatformType } from "@/lib/types";
import { PLATFORM_CONFIG } from "@/lib/types";

const PLATFORM_LIMITS: Record<
  string,
  { maxChars: number; mediaRequired?: string; label: string }
> = {
  instagram: { maxChars: 2200, mediaRequired: "image", label: "画像必須 / 2,200字" },
  youtube: { maxChars: 5000, mediaRequired: "video", label: "動画必須 / 5,000字" },
  threads: { maxChars: 500, label: "500字" },
  tiktok: { maxChars: 2200, mediaRequired: "video", label: "動画必須 / 2,200字" },
  x: { maxChars: 280, label: "280字" },
};

const SCHEDULABLE_PLATFORMS: PlatformType[] = [
  "instagram",
  "youtube",
  "threads",
  "tiktok",
  "x",
];

interface PostComposerProps {
  onSubmit?: (data: {
    caption: string;
    hashtags: string[];
    platforms: PlatformType[];
    scheduledAt: string;
    mediaUrls: string[];
  }) => void;
  initialCaption?: string;
  initialHashtags?: string[];
}

export function PostComposer({
  onSubmit,
  initialCaption = "",
  initialHashtags = [],
}: PostComposerProps) {
  const [caption, setCaption] = useState(initialCaption);
  const [hashtags, setHashtags] = useState(initialHashtags.join(" "));
  const [selectedPlatforms, setSelectedPlatforms] = useState<
    Set<PlatformType>
  >(new Set());
  const [scheduledAt, setScheduledAt] = useState("");
  const [mediaUrls] = useState<string[]>([]);
  const [insertLineLink, setInsertLineLink] = useState(false);
  const [lineUrl, setLineUrl] = useState("");
  const [lineCampaign, setLineCampaign] = useState("");

  const togglePlatform = (p: PlatformType) => {
    const next = new Set(selectedPlatforms);
    if (next.has(p)) {
      next.delete(p);
    } else {
      next.add(p);
    }
    setSelectedPlatforms(next);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onSubmit) return;
    onSubmit({
      caption,
      hashtags: hashtags
        .split(/[\s,]+/)
        .filter(Boolean)
        .map((h) => (h.startsWith("#") ? h : `#${h}`)),
      platforms: Array.from(selectedPlatforms),
      scheduledAt,
      mediaUrls,
    });
  };

  // Character warnings
  const charWarnings = Array.from(selectedPlatforms)
    .filter((p) => {
      const limit = PLATFORM_LIMITS[p];
      return limit && caption.length > limit.maxChars;
    })
    .map((p) => `${PLATFORM_CONFIG[p].label}: ${PLATFORM_LIMITS[p].maxChars}字超過`);

  const mediaWarnings = Array.from(selectedPlatforms)
    .filter((p) => {
      const limit = PLATFORM_LIMITS[p];
      return limit?.mediaRequired && mediaUrls.length === 0;
    })
    .map(
      (p) =>
        `${PLATFORM_CONFIG[p].label}: ${PLATFORM_LIMITS[p].mediaRequired === "video" ? "動画" : "画像"}が必要です`
    );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">投稿を作成</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Platform selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              投稿先プラットフォーム
            </label>
            <div className="flex flex-wrap gap-2">
              {SCHEDULABLE_PLATFORMS.map((p) => {
                const config = PLATFORM_CONFIG[p];
                const selected = selectedPlatforms.has(p);
                const limit = PLATFORM_LIMITS[p];
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => togglePlatform(p)}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                      selected
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: config.color }}
                    />
                    <span className="font-medium">{config.label}</span>
                    <span className="text-[10px] text-gray-400">
                      {limit.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Caption */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              キャプション
            </label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={5}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="投稿内容を入力..."
            />
            <div className="mt-1 flex items-center justify-between text-xs text-gray-400">
              <span>{caption.length}文字</span>
              {charWarnings.length > 0 && (
                <span className="text-amber-500">
                  {charWarnings.join(" / ")}
                </span>
              )}
            </div>
          </div>

          {/* Hashtags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ハッシュタグ
            </label>
            <input
              type="text"
              value={hashtags}
              onChange={(e) => setHashtags(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="#マーケティング #SNS運用 #ブランディング"
            />
          </div>

          {/* Media upload placeholder */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              メディア
            </label>
            <div className="flex h-24 items-center justify-center rounded-lg border-2 border-dashed border-gray-200 text-sm text-gray-400">
              画像・動画をドラッグ＆ドロップ（Supabase Storage連携後に有効化）
            </div>
            {mediaWarnings.length > 0 && (
              <p className="mt-1 text-xs text-amber-500">
                {mediaWarnings.join(" / ")}
              </p>
            )}
          </div>

          {/* LINE tracking link */}
          <div className="rounded-lg border border-gray-200 p-4 space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={insertLineLink}
                onChange={(e) => setInsertLineLink(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">
                LINE導線リンクを挿入
              </span>
              <span className="text-xs text-gray-400">
                (LINE Harness連携)
              </span>
            </label>
            {insertLineLink && (
              <div className="space-y-2 pl-6">
                <input
                  type="url"
                  value={lineUrl}
                  onChange={(e) => setLineUrl(e.target.value)}
                  placeholder="https://lin.ee/xxxxxxx"
                  className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <input
                  type="text"
                  value={lineCampaign}
                  onChange={(e) => setLineCampaign(e.target.value)}
                  placeholder="キャンペーン名（例: spring_2026）"
                  className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                {lineUrl && selectedPlatforms.size > 0 && (
                  <p className="text-xs text-gray-400">
                    各プラットフォーム別にUTMパラメータ付きURLがキャプション末尾に自動追加されます
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Schedule date/time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              予約日時
            </label>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={
                selectedPlatforms.size === 0 ||
                !caption.trim() ||
                !scheduledAt
              }
              className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              予約投稿を作成
            </button>
            <button
              type="button"
              className="rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              下書き保存
            </button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

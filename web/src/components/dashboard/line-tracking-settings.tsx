"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const PLATFORMS = [
  { key: "instagram", label: "Instagram", color: "#E1306C" },
  { key: "youtube", label: "YouTube", color: "#FF0000" },
  { key: "threads", label: "Threads", color: "#000000" },
  { key: "tiktok", label: "TikTok", color: "#00F2EA" },
  { key: "x", label: "X", color: "#1DA1F2" },
] as const;

interface Props {
  onUrlsGenerated?: (urls: Record<string, string>) => void;
}

export function LineTrackingSettings({ onUrlsGenerated }: Props) {
  const [lineUrl, setLineUrl] = useState("");
  const [campaignName, setCampaignName] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  const generatedUrls = useMemo(() => {
    if (!lineUrl.trim()) return {};
    const base = lineUrl.trim().replace(/\?.*$/, "");
    const campaign = campaignName.trim() || "default";

    const urls: Record<string, string> = {};
    for (const p of PLATFORMS) {
      urls[p.key] =
        `${base}?utm_source=${p.key}&utm_medium=social&utm_campaign=${encodeURIComponent(campaign)}`;
    }
    return urls;
  }, [lineUrl, campaignName]);

  const handleCopy = (platform: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopied(platform);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleExport = () => {
    if (onUrlsGenerated) {
      onUrlsGenerated(generatedUrls);
    }
  };

  return (
    <div className="space-y-6">
      {/* Input section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">LINE公式アカウント設定</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              LINE公式アカウントURL
            </label>
            <input
              type="url"
              value={lineUrl}
              onChange={(e) => setLineUrl(e.target.value)}
              placeholder="https://lin.ee/xxxxxxx"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <p className="mt-1 text-xs text-gray-400">
              LINE公式アカウントの友だち追加URLを入力してください
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              キャンペーン名
            </label>
            <input
              type="text"
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              placeholder="例: spring_2026, product_launch"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <p className="mt-1 text-xs text-gray-400">
              UTM campaignパラメータに使用されます（英数字推奨）
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Generated URLs */}
      {lineUrl.trim() && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                プラットフォーム別トラッキングURL
              </CardTitle>
              {onUrlsGenerated && (
                <button
                  onClick={handleExport}
                  className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 transition-colors"
                >
                  PostComposerに適用
                </button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {PLATFORMS.map((p) => {
                const url = generatedUrls[p.key];
                if (!url) return null;
                return (
                  <div key={p.key} className="flex items-center gap-3">
                    <div className="flex items-center gap-2 w-28 shrink-0">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: p.color }}
                      />
                      <span className="text-sm font-medium text-gray-700">
                        {p.label}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <code className="block truncate rounded bg-gray-50 px-3 py-2 text-xs text-gray-600 font-mono">
                        {url}
                      </code>
                    </div>
                    <button
                      onClick={() => handleCopy(p.key, url)}
                      className="shrink-0 rounded-md border border-gray-200 px-2.5 py-1.5 text-xs text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      {copied === p.key ? "✓ コピー済" : "コピー"}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* UTM parameter explanation */}
            <div className="mt-4 rounded-lg bg-blue-50 p-3">
              <p className="text-xs font-medium text-blue-700 mb-1">
                LINE Harness連携について
              </p>
              <p className="text-xs text-blue-600 leading-relaxed">
                生成されたUTMパラメータ付きURLをSNS投稿に挿入すると、
                LINE Harness側で「どのSNSプラットフォームからLINE登録に至ったか」を
                自動的にトラッキングできます。utm_source（流入元）とutm_campaign（キャンペーン名）で
                経路分析が可能です。
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

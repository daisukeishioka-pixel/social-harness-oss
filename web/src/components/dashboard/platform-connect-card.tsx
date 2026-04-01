"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PLATFORM_CONFIG, type PlatformType } from "@/lib/types";

interface PlatformConnectCardProps {
  platform: PlatformType;
  label: string;
  description: string;
  connected: boolean;
  username?: string;
  optional?: boolean;
}

export function PlatformConnectCard({
  platform,
  label,
  description,
  connected,
  username,
  optional,
}: PlatformConnectCardProps) {
  const config = PLATFORM_CONFIG[platform];

  const handleConnect = () => {
    // Build OAuth URL based on platform
    const origin = window.location.origin;
    let authUrl = "";

    switch (platform) {
      case "instagram":
        authUrl = `${origin}/api/auth/instagram/connect`;
        break;
      case "threads":
        authUrl = `${origin}/api/auth/threads/connect`;
        break;
      case "youtube":
        authUrl = `${origin}/api/auth/youtube/connect`;
        break;
      case "x":
        // X requires client-provided API keys
        window.location.href = "/dashboard/settings?tab=x";
        return;
    }

    if (authUrl) window.location.href = authUrl;
  };

  return (
    <Card
      className={`relative overflow-hidden transition-shadow hover:shadow-md ${
        connected ? "border-green-200" : ""
      }`}
    >
      {optional && (
        <div className="absolute right-2 top-2">
          <Badge variant="outline" className="text-[10px] text-gray-400">
            オプション
          </Badge>
        </div>
      )}
      <CardContent className="pt-5 pb-4">
        <div className="flex items-start gap-3">
          {/* Platform icon circle */}
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
            style={{ backgroundColor: config.color }}
          >
            {label[0]}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-sm">{label}</p>
            {connected ? (
              <p className="text-xs text-green-600 mt-0.5">
                @{username} 接続済み
              </p>
            ) : (
              <p className="text-xs text-gray-400 mt-0.5">{description}</p>
            )}
          </div>
        </div>

        {!connected && (
          <button
            onClick={handleConnect}
            className="mt-3 w-full rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            {platform === "x" ? "APIキーを設定" : "アカウントを接続"}
          </button>
        )}
      </CardContent>
    </Card>
  );
}

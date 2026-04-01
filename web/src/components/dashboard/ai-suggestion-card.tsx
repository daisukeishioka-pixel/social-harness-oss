"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PLATFORM_CONFIG, type PlatformType } from "@/lib/types";

interface AiSuggestion {
  id?: string;
  content: string;
  platform?: string | null;
  hashtags?: string[];
  reasoning?: string;
  status: string;
  context?: Record<string, unknown>;
}

interface Props {
  suggestion: AiSuggestion;
  onAccept?: (suggestion: AiSuggestion) => void;
  onReject?: (id: string) => void;
}

export function AiSuggestionCard({ suggestion, onAccept, onReject }: Props) {
  const [status, setStatus] = useState(suggestion.status);
  const hashtags =
    suggestion.hashtags ||
    (suggestion.context?.hashtags as string[]) ||
    [];
  const reasoning =
    suggestion.reasoning ||
    (suggestion.context?.reasoning as string) ||
    "";
  const platform = suggestion.platform as PlatformType | null;
  const platformConfig = platform ? PLATFORM_CONFIG[platform] : null;

  const handleAccept = () => {
    setStatus("accepted");
    onAccept?.(suggestion);
  };

  const handleReject = () => {
    setStatus("rejected");
    if (suggestion.id) onReject?.(suggestion.id);
  };

  return (
    <Card
      className={`transition-opacity ${status === "rejected" ? "opacity-50" : ""}`}
    >
      <CardContent className="pt-5 pb-4 space-y-3">
        {/* Header: platform + status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg
              className="w-4 h-4 text-blue-500"
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
            <span className="text-xs font-medium text-blue-600">AI提案</span>
            {platformConfig && (
              <Badge
                variant="outline"
                className="text-[10px]"
                style={{
                  borderColor: platformConfig.color,
                  color: platformConfig.color,
                }}
              >
                {platformConfig.label}
              </Badge>
            )}
          </div>
          {status !== "pending" && (
            <Badge
              variant="outline"
              className={`text-[10px] ${
                status === "accepted"
                  ? "bg-green-50 text-green-700 border-green-200"
                  : "bg-gray-50 text-gray-500 border-gray-200"
              }`}
            >
              {status === "accepted" ? "採用" : "却下"}
            </Badge>
          )}
        </div>

        {/* Caption preview */}
        <p className="text-sm text-gray-900 whitespace-pre-line leading-relaxed">
          {suggestion.content}
        </p>

        {/* Hashtags */}
        {hashtags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {hashtags.map((tag, i) => (
              <span
                key={i}
                className="rounded-md bg-blue-50 px-1.5 py-0.5 text-[11px] text-blue-600"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Reasoning */}
        {reasoning && (
          <p className="text-xs text-gray-400 italic">{reasoning}</p>
        )}

        {/* Action buttons */}
        {status === "pending" && (
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleAccept}
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 transition-colors"
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              採用して投稿作成
            </button>
            <button
              onClick={handleReject}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-50 transition-colors"
            >
              却下
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PLATFORM_CONFIG } from "@/lib/types";

interface ScheduledPost {
  id: string;
  caption: string | null;
  scheduled_at: string;
  status: string;
  target_platforms: Array<{ platform: string }>;
}

// Mock data for display before real data
const MOCK_POSTS: ScheduledPost[] = [
  {
    id: "m1",
    caption: "春の新作コレクション発表！",
    scheduled_at: new Date(Date.now() + 2 * 86400000).toISOString(),
    status: "scheduled",
    target_platforms: [{ platform: "instagram" }, { platform: "threads" }],
  },
  {
    id: "m2",
    caption: "【解説動画】SNS運用の基本",
    scheduled_at: new Date(Date.now() + 5 * 86400000).toISOString(),
    status: "scheduled",
    target_platforms: [{ platform: "youtube" }, { platform: "tiktok" }],
  },
  {
    id: "m3",
    caption: "週末イベントのお知らせ",
    scheduled_at: new Date(Date.now() + 8 * 86400000).toISOString(),
    status: "draft",
    target_platforms: [{ platform: "instagram" }, { platform: "threads" }, { platform: "tiktok" }],
  },
];

interface Props {
  posts?: ScheduledPost[];
}

export function SchedulerCalendar({ posts }: Props) {
  const data = posts && posts.length > 0 ? posts : MOCK_POSTS;
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: Array<{ day: number | null; posts: ScheduledPost[] }> = [];

    // Padding for first week
    for (let i = 0; i < firstDay; i++) {
      days.push({ day: null, posts: [] });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const dayPosts = data.filter((p) => p.scheduled_at.startsWith(dateStr));
      days.push({ day: d, posts: dayPosts });
    }

    return days;
  }, [year, month, data]);

  const today = new Date();
  const isToday = (day: number) =>
    day === today.getDate() &&
    month === today.getMonth() &&
    year === today.getFullYear();

  const prevMonth = () =>
    setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () =>
    setCurrentDate(new Date(year, month + 1, 1));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">投稿カレンダー</CardTitle>
          <div className="flex items-center gap-3">
            <button
              onClick={prevMonth}
              className="rounded-md p-1.5 hover:bg-gray-100 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-sm font-medium min-w-[120px] text-center">
              {year}年{month + 1}月
            </span>
            <button
              onClick={nextMonth}
              className="rounded-md p-1.5 hover:bg-gray-100 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Day headers */}
        <div className="grid grid-cols-7 text-center text-xs font-medium text-gray-500 mb-1">
          {["日", "月", "火", "水", "木", "金", "土"].map((d) => (
            <div key={d} className="py-2">
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-px bg-gray-100 rounded-lg overflow-hidden">
          {calendarDays.map((cell, i) => (
            <div
              key={i}
              className={`min-h-[80px] bg-white p-1.5 ${
                cell.day === null ? "bg-gray-50" : ""
              }`}
            >
              {cell.day !== null && (
                <>
                  <span
                    className={`inline-flex items-center justify-center w-6 h-6 text-xs rounded-full ${
                      isToday(cell.day)
                        ? "bg-blue-600 text-white font-bold"
                        : "text-gray-700"
                    }`}
                  >
                    {cell.day}
                  </span>
                  <div className="mt-1 space-y-0.5">
                    {cell.posts.map((post) => (
                      <div
                        key={post.id}
                        className="flex items-center gap-0.5 rounded px-1 py-0.5 text-[10px] leading-tight bg-blue-50 text-blue-700 truncate cursor-pointer hover:bg-blue-100"
                        title={post.caption || ""}
                      >
                        {post.target_platforms.slice(0, 2).map((tp) => (
                          <span
                            key={tp.platform}
                            className="inline-block w-1.5 h-1.5 rounded-full shrink-0"
                            style={{
                              backgroundColor:
                                PLATFORM_CONFIG[tp.platform as keyof typeof PLATFORM_CONFIG]
                                  ?.color || "#888",
                            }}
                          />
                        ))}
                        <span className="truncate">
                          {post.caption?.slice(0, 15) || "無題"}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

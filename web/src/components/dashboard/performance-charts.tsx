"use client";

import {
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getChartData,
  getPostPerformanceData,
  type PeriodKey,
  type PlatformKey,
} from "@/lib/mock-data";
import { PLATFORM_CONFIG } from "@/lib/types";

const BRAND_COLOR = "#2563EB";

const PERIOD_OPTIONS: { key: PeriodKey; label: string }[] = [
  { key: "day", label: "日" },
  { key: "week", label: "週" },
  { key: "month", label: "月" },
  { key: "6month", label: "6ヶ月" },
  { key: "year", label: "1年" },
];

function PeriodSelector({
  value,
  onChange,
}: {
  value: PeriodKey;
  onChange: (v: PeriodKey) => void;
}) {
  return (
    <div className="inline-flex items-center rounded-lg bg-gray-100 p-0.5 text-xs">
      {PERIOD_OPTIONS.map((opt) => (
        <button
          key={opt.key}
          onClick={() => onChange(opt.key)}
          className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
            value === opt.key
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function getChartColor(platform: PlatformKey | "all"): string {
  if (platform === "all") return BRAND_COLOR;
  return PLATFORM_CONFIG[platform].color;
}

function getChartLabel(platform: PlatformKey | "all"): string {
  if (platform === "all") return "全体";
  return PLATFORM_CONFIG[platform].label;
}

// --- Follower Chart ---

export function FollowerChart({
  platform = "all",
  period,
  onPeriodChange,
}: {
  platform?: PlatformKey | "all";
  period: PeriodKey;
  onPeriodChange: (p: PeriodKey) => void;
}) {
  const data = getChartData(platform, period);
  const color = getChartColor(platform);
  const label = getChartLabel(platform);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">フォロワー推移</CardTitle>
          <PeriodSelector value={period} onChange={onPeriodChange} />
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" fontSize={12} />
            <YAxis fontSize={12} />
            <Tooltip />
            <Legend />
            <Area
              type="monotone"
              dataKey="followers"
              name={label}
              stroke={color}
              fill={color}
              fillOpacity={0.15}
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// --- Engagement Chart ---

export function EngagementChart({
  platform = "all",
  period,
  onPeriodChange,
}: {
  platform?: PlatformKey | "all";
  period: PeriodKey;
  onPeriodChange: (p: PeriodKey) => void;
}) {
  const data = getChartData(platform, period);
  const color = getChartColor(platform);
  const label = getChartLabel(platform);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">エンゲージメント率推移 (%)</CardTitle>
          <PeriodSelector value={period} onChange={onPeriodChange} />
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" fontSize={12} />
            <YAxis fontSize={12} unit="%" />
            <Tooltip formatter={(value) => `${value}%`} />
            <Legend />
            <Line
              type="monotone"
              dataKey="engagementRate"
              name={label}
              stroke={color}
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// --- Post Performance Bar Chart ---

export function PostPerformanceChart({
  platform = "all",
}: {
  platform?: PlatformKey | "all";
}) {
  const data = getPostPerformanceData(platform);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">投稿別パフォーマンス比較</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" fontSize={12} />
            <YAxis fontSize={12} />
            <Tooltip />
            <Legend />
            <Bar dataKey="impressions" name="インプレッション" fill="#6366f1" />
            <Bar dataKey="reach" name="リーチ" fill="#22c55e" />
            <Bar dataKey="engagement" name="エンゲージメント" fill="#f59e0b" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

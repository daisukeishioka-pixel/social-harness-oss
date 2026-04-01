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

// -- Mock data --

const followerData = [
  { date: "3/1", instagram: 12400, youtube: 8500, threads: 3200, tiktok: 15800 },
  { date: "3/5", instagram: 12650, youtube: 8620, threads: 3350, tiktok: 16200 },
  { date: "3/10", instagram: 12900, youtube: 8780, threads: 3510, tiktok: 16900 },
  { date: "3/15", instagram: 13200, youtube: 8950, threads: 3700, tiktok: 17500 },
  { date: "3/20", instagram: 13500, youtube: 9100, threads: 3880, tiktok: 18300 },
  { date: "3/25", instagram: 13850, youtube: 9300, threads: 4050, tiktok: 19100 },
  { date: "3/31", instagram: 14200, youtube: 9520, threads: 4250, tiktok: 20000 },
];

const engagementData = [
  { date: "3/1", instagram: 4.2, youtube: 6.1, threads: 8.5, tiktok: 12.3 },
  { date: "3/5", instagram: 3.8, youtube: 5.8, threads: 7.9, tiktok: 11.5 },
  { date: "3/10", instagram: 4.5, youtube: 6.3, threads: 9.1, tiktok: 13.1 },
  { date: "3/15", instagram: 4.1, youtube: 5.5, threads: 8.2, tiktok: 11.8 },
  { date: "3/20", instagram: 4.8, youtube: 6.7, threads: 9.5, tiktok: 14.2 },
  { date: "3/25", instagram: 4.3, youtube: 6.0, threads: 8.8, tiktok: 12.6 },
  { date: "3/31", instagram: 4.6, youtube: 6.4, threads: 9.2, tiktok: 13.5 },
];

const postPerformanceData = [
  { name: "投稿1", impressions: 4500, reach: 3200, engagement: 280 },
  { name: "投稿2", impressions: 6200, reach: 4800, engagement: 420 },
  { name: "投稿3", impressions: 3800, reach: 2900, engagement: 190 },
  { name: "投稿4", impressions: 7100, reach: 5500, engagement: 510 },
  { name: "投稿5", impressions: 5300, reach: 4100, engagement: 350 },
];

const COLORS = {
  instagram: "#E1306C",
  youtube: "#FF0000",
  threads: "#000000",
  tiktok: "#00F2EA",
};

export function FollowerChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">フォロワー推移</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={followerData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" fontSize={12} />
            <YAxis fontSize={12} />
            <Tooltip />
            <Legend />
            <Area
              type="monotone"
              dataKey="instagram"
              name="Instagram"
              stroke={COLORS.instagram}
              fill={COLORS.instagram}
              fillOpacity={0.15}
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="youtube"
              name="YouTube"
              stroke={COLORS.youtube}
              fill={COLORS.youtube}
              fillOpacity={0.15}
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="threads"
              name="Threads"
              stroke={COLORS.threads}
              fill={COLORS.threads}
              fillOpacity={0.08}
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="tiktok"
              name="TikTok"
              stroke={COLORS.tiktok}
              fill={COLORS.tiktok}
              fillOpacity={0.15}
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function EngagementChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">エンゲージメント率推移 (%)</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={engagementData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" fontSize={12} />
            <YAxis fontSize={12} unit="%" />
            <Tooltip formatter={(value) => `${value}%`} />
            <Legend />
            <Line
              type="monotone"
              dataKey="instagram"
              name="Instagram"
              stroke={COLORS.instagram}
              strokeWidth={2}
              dot={{ r: 3 }}
            />
            <Line
              type="monotone"
              dataKey="youtube"
              name="YouTube"
              stroke={COLORS.youtube}
              strokeWidth={2}
              dot={{ r: 3 }}
            />
            <Line
              type="monotone"
              dataKey="threads"
              name="Threads"
              stroke={COLORS.threads}
              strokeWidth={2}
              dot={{ r: 3 }}
            />
            <Line
              type="monotone"
              dataKey="tiktok"
              name="TikTok"
              stroke={COLORS.tiktok}
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function PostPerformanceChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">投稿別パフォーマンス比較</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={postPerformanceData}>
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

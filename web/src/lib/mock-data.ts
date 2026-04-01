import { format, subDays, subWeeks, subMonths, startOfWeek, startOfMonth } from "date-fns";
import { ja } from "date-fns/locale";

export type PeriodKey = "day" | "week" | "month" | "6month" | "year";
export type PlatformKey = "instagram" | "youtube" | "threads" | "tiktok";

const PLATFORM_BASES: Record<PlatformKey, {
  followers: number;
  followerGrowth: number;
  reach: number;
  engagementRate: number;
  postsPerMonth: number;
}> = {
  instagram: { followers: 14200, followerGrowth: 50, reach: 4800, engagementRate: 4.5, postsPerMonth: 8 },
  youtube:   { followers: 9520,  followerGrowth: 30, reach: 6200, engagementRate: 6.2, postsPerMonth: 4 },
  threads:   { followers: 4250,  followerGrowth: 40, reach: 2100, engagementRate: 8.8, postsPerMonth: 6 },
  tiktok:    { followers: 20000, followerGrowth: 80, reach: 5300, engagementRate: 12.5, postsPerMonth: 6 },
};

const ALL_PLATFORMS: PlatformKey[] = ["instagram", "youtube", "threads", "tiktok"];

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297;
  return x - Math.floor(x);
}

function jitter(base: number, pct: number, seed: number): number {
  return Math.round(base * (1 + (seededRandom(seed) - 0.5) * 2 * pct));
}

interface DataPoint {
  date: string;
  followers: number;
  reach: number;
  engagementRate: number;
}

function generateDailyData(platform: PlatformKey, days: number): DataPoint[] {
  const b = PLATFORM_BASES[platform];
  const now = new Date();
  const points: DataPoint[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const d = subDays(now, i);
    const seed = d.getTime() + platform.charCodeAt(0);
    const dayIndex = days - 1 - i;
    points.push({
      date: format(d, "M/d"),
      followers: Math.round(b.followers - b.followerGrowth * (i / 30) + jitter(0, 1, seed) * 20),
      reach: jitter(b.reach, 0.3, seed + 1),
      engagementRate: +(b.engagementRate + (seededRandom(seed + 2) - 0.5) * 2).toFixed(1),
    });
  }
  return points;
}

function aggregateWeekly(daily: DataPoint[]): DataPoint[] {
  const weeks: Map<string, DataPoint[]> = new Map();
  for (const dp of daily) {
    // Group by week start label
    const parts = dp.date.split("/");
    const m = parseInt(parts[0]) - 1;
    const d = parseInt(parts[1]);
    const date = new Date(2026, m, d);
    const ws = startOfWeek(date, { weekStartsOn: 1 });
    const key = format(ws, "M/d");
    if (!weeks.has(key)) weeks.set(key, []);
    weeks.get(key)!.push(dp);
  }

  return Array.from(weeks.entries()).map(([key, pts]) => ({
    date: key + "〜",
    followers: pts[pts.length - 1].followers,
    reach: pts.reduce((s, p) => s + p.reach, 0),
    engagementRate: +(pts.reduce((s, p) => s + p.engagementRate, 0) / pts.length).toFixed(1),
  }));
}

function aggregateMonthly(daily: DataPoint[]): DataPoint[] {
  const months: Map<string, DataPoint[]> = new Map();
  for (const dp of daily) {
    const parts = dp.date.split("/");
    const key = parts[0] + "月";
    if (!months.has(key)) months.set(key, []);
    months.get(key)!.push(dp);
  }

  return Array.from(months.entries()).map(([key, pts]) => ({
    date: key,
    followers: pts[pts.length - 1].followers,
    reach: pts.reduce((s, p) => s + p.reach, 0),
    engagementRate: +(pts.reduce((s, p) => s + p.engagementRate, 0) / pts.length).toFixed(1),
  }));
}

export function getChartData(
  platform: PlatformKey | "all",
  period: PeriodKey
): DataPoint[] {
  const dayCount = period === "day" ? 30
    : period === "week" ? 84 // 12 weeks
    : period === "month" ? 365
    : period === "6month" ? 180
    : 365; // year

  if (platform === "all") {
    // Sum across all platforms
    const perPlatform = ALL_PLATFORMS.map((p) => generateDailyData(p, dayCount));
    const combined: DataPoint[] = perPlatform[0].map((_, i) => ({
      date: perPlatform[0][i].date,
      followers: ALL_PLATFORMS.reduce((s, _, pi) => s + perPlatform[pi][i].followers, 0),
      reach: ALL_PLATFORMS.reduce((s, _, pi) => s + perPlatform[pi][i].reach, 0),
      engagementRate: +(
        ALL_PLATFORMS.reduce((s, _, pi) => s + perPlatform[pi][i].engagementRate, 0) /
        ALL_PLATFORMS.length
      ).toFixed(1),
    }));

    if (period === "day") return combined;
    if (period === "week") return aggregateWeekly(combined);
    return aggregateMonthly(combined);
  }

  const daily = generateDailyData(platform, dayCount);
  if (period === "day") return daily;
  if (period === "week") return aggregateWeekly(daily);
  return aggregateMonthly(daily);
}

export interface KpiData {
  followers: { value: string; change: number };
  reach: { value: string; change: number };
  engagementRate: { value: string; change: number };
  posts: { value: string };
}

export function getKpiData(platform: PlatformKey | "all"): KpiData {
  if (platform === "all") {
    const totalFollowers = ALL_PLATFORMS.reduce((s, p) => s + PLATFORM_BASES[p].followers, 0);
    const totalReach = ALL_PLATFORMS.reduce((s, p) => s + PLATFORM_BASES[p].reach * 7, 0);
    const avgER = +(ALL_PLATFORMS.reduce((s, p) => s + PLATFORM_BASES[p].engagementRate, 0) / ALL_PLATFORMS.length).toFixed(1);
    const totalPosts = ALL_PLATFORMS.reduce((s, p) => s + PLATFORM_BASES[p].postsPerMonth, 0);

    return {
      followers: { value: totalFollowers.toLocaleString(), change: 3.2 },
      reach: { value: (totalReach).toLocaleString(), change: 5.1 },
      engagementRate: { value: `${avgER}%`, change: 0.8 },
      posts: { value: String(totalPosts) },
    };
  }

  const b = PLATFORM_BASES[platform];
  return {
    followers: { value: b.followers.toLocaleString(), change: +(b.followerGrowth / b.followers * 100).toFixed(1) },
    reach: { value: (b.reach * 7).toLocaleString(), change: +(seededRandom(platform.charCodeAt(0)) * 8).toFixed(1) },
    engagementRate: { value: `${b.engagementRate}%`, change: +(seededRandom(platform.charCodeAt(1)) * 2 - 0.5).toFixed(1) },
    posts: { value: String(b.postsPerMonth) },
  };
}

// Bar chart mock data for post performance comparison
export function getPostPerformanceData(platform: PlatformKey | "all") {
  const posts = platform === "all"
    ? [
        { name: "投稿1", impressions: 4500, reach: 3200, engagement: 280 },
        { name: "投稿2", impressions: 6200, reach: 4800, engagement: 420 },
        { name: "投稿3", impressions: 3800, reach: 2900, engagement: 190 },
        { name: "投稿4", impressions: 7100, reach: 5500, engagement: 510 },
        { name: "投稿5", impressions: 5300, reach: 4100, engagement: 350 },
      ]
    : Array.from({ length: 5 }, (_, i) => {
        const base = PLATFORM_BASES[platform];
        const seed = i + platform.charCodeAt(0);
        return {
          name: `投稿${i + 1}`,
          impressions: jitter(base.reach * 1.5, 0.4, seed),
          reach: jitter(base.reach, 0.4, seed + 10),
          engagement: jitter(Math.round(base.reach * base.engagementRate / 100), 0.4, seed + 20),
        };
      });
  return posts;
}

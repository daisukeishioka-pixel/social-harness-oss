"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MetricCard } from "@/components/dashboard/metric-card";
import {
  FollowerChart,
  EngagementChart,
  PostPerformanceChart,
} from "@/components/dashboard/performance-charts";
import { PostPerformanceTable } from "@/components/dashboard/post-performance-table";
import { getKpiData, type PeriodKey, type PlatformKey } from "@/lib/mock-data";

function SvgIcon({ d }: { d: string }) {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} />
    </svg>
  );
}

type TabValue = "all" | PlatformKey;

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<TabValue>("all");
  const [period, setPeriod] = useState<PeriodKey>("month");

  const kpi = getKpiData(activeTab);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">ダッシュボード</h2>
        <p className="text-sm text-gray-500 mt-1">
          SNSアカウントの状況を一覧で確認できます
        </p>
      </div>

      {/* Summary metrics — reactive to selected tab */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="総フォロワー"
          value={kpi.followers.value}
          change={kpi.followers.change}
          description={activeTab === "all" ? "全プラットフォーム合計" : `${activeTab}のフォロワー`}
          href="/dashboard/analytics"
          icon={
            <SvgIcon d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          }
        />
        <MetricCard
          label="今週のリーチ"
          value={kpi.reach.value}
          change={kpi.reach.change}
          description="7日間合計"
          href="/dashboard/analytics"
          icon={
            <SvgIcon d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          }
          accentColor="#8B5CF6"
        />
        <MetricCard
          label="エンゲージメント率"
          value={kpi.engagementRate.value}
          change={kpi.engagementRate.change}
          description="平均"
          href="/dashboard/post-list"
          icon={
            <SvgIcon d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          }
          accentColor="#EC4899"
        />
        <MetricCard
          label="今月の投稿数"
          value={kpi.posts.value}
          change={null}
          description={activeTab === "all" ? "全プラットフォーム" : activeTab}
          href="/dashboard/posts"
          icon={
            <SvgIcon d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          }
          accentColor="#F59E0B"
        />
      </div>

      {/* Platform tabs */}
      <Tabs
        defaultValue="all"
        onValueChange={(v) => setActiveTab(v as TabValue)}
      >
        <TabsList>
          <TabsTrigger value="all">全体</TabsTrigger>
          <TabsTrigger value="instagram">Instagram</TabsTrigger>
          <TabsTrigger value="youtube">YouTube</TabsTrigger>
          <TabsTrigger value="threads">Threads</TabsTrigger>
          <TabsTrigger value="tiktok">TikTok</TabsTrigger>
        </TabsList>

        {(["all", "instagram", "youtube", "threads", "tiktok"] as TabValue[]).map(
          (tab) => (
            <TabsContent key={tab} value={tab} className="mt-4 space-y-4">
              <FollowerChart
                platform={tab}
                period={period}
                onPeriodChange={setPeriod}
              />
              <EngagementChart
                platform={tab}
                period={period}
                onPeriodChange={setPeriod}
              />
              <PostPerformanceChart platform={tab} />
            </TabsContent>
          )
        )}
      </Tabs>

      {/* Post performance table */}
      <PostPerformanceTable />
    </div>
  );
}

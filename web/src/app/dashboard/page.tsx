import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlatformConnectCard } from "@/components/dashboard/platform-connect-card";
import { MetricCard } from "@/components/dashboard/metric-card";
import {
  FollowerChart,
  EngagementChart,
  PostPerformanceChart,
} from "@/components/dashboard/performance-charts";
import { PostPerformanceTable } from "@/components/dashboard/post-performance-table";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">ダッシュボード</h2>
        <p className="text-sm text-gray-500 mt-1">
          SNSアカウントの状況を一覧で確認できます
        </p>
      </div>

      {/* Platform connection status */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <PlatformConnectCard
          platform="instagram"
          label="Instagram"
          description="写真・動画・リール・ストーリーズ"
          connected={false}
        />
        <PlatformConnectCard
          platform="youtube"
          label="YouTube"
          description="動画アップロード・分析"
          connected={false}
        />
        <PlatformConnectCard
          platform="threads"
          label="Threads"
          description="テキスト・画像・動画"
          connected={false}
        />
        <PlatformConnectCard
          platform="x"
          label="X (オプション)"
          description="クライアントAPIキー必要"
          connected={false}
          optional
        />
      </div>

      {/* Summary metrics (mock aggregates; replaced by real data when accounts are connected) */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard
          label="総フォロワー"
          value="27,970"
          change={3.2}
          description="全プラットフォーム合計"
        />
        <MetricCard
          label="今週のリーチ"
          value="18,400"
          change={5.1}
          description="7日間合計"
        />
        <MetricCard
          label="エンゲージメント率"
          value="6.4%"
          change={0.8}
          description="平均"
        />
        <MetricCard
          label="今月の投稿数"
          value="24"
          change={null}
          description="全プラットフォーム"
        />
      </div>

      {/* Platform tabs */}
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">全体</TabsTrigger>
          <TabsTrigger value="instagram">Instagram</TabsTrigger>
          <TabsTrigger value="youtube">YouTube</TabsTrigger>
          <TabsTrigger value="threads">Threads</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4 space-y-4">
          <FollowerChart />
          <EngagementChart />
          <PostPerformanceChart />
        </TabsContent>

        <TabsContent value="instagram" className="mt-4 space-y-4">
          <FollowerChart />
          <EngagementChart />
          <PostPerformanceChart />
        </TabsContent>

        <TabsContent value="youtube" className="mt-4 space-y-4">
          <FollowerChart />
          <EngagementChart />
          <PostPerformanceChart />
        </TabsContent>

        <TabsContent value="threads" className="mt-4 space-y-4">
          <FollowerChart />
          <EngagementChart />
          <PostPerformanceChart />
        </TabsContent>
      </Tabs>

      {/* Post performance table */}
      <PostPerformanceTable />
    </div>
  );
}

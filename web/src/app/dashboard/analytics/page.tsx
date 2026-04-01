import {
  FollowerChart,
  EngagementChart,
  PostPerformanceChart,
} from "@/components/dashboard/performance-charts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AnalyticsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">パフォーマンス分析</h1>
        <p className="text-sm text-gray-500 mt-1">
          フォロワー推移・エンゲージメント率・投稿パフォーマンスを可視化
        </p>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">全体</TabsTrigger>
          <TabsTrigger value="instagram">Instagram</TabsTrigger>
          <TabsTrigger value="youtube">YouTube</TabsTrigger>
          <TabsTrigger value="threads">Threads</TabsTrigger>
          <TabsTrigger value="tiktok">TikTok</TabsTrigger>
        </TabsList>

        {["all", "instagram", "youtube", "threads", "tiktok"].map((tab) => (
          <TabsContent key={tab} value={tab} className="mt-4 space-y-4">
            <FollowerChart />
            <EngagementChart />
            <PostPerformanceChart />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

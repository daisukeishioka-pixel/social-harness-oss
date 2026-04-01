import { PostPerformanceTable } from "@/components/dashboard/post-performance-table";

export default function PostListPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">投稿一覧</h1>
        <p className="text-sm text-gray-500 mt-1">
          全プラットフォームの投稿パフォーマンスを一覧で確認・比較
        </p>
      </div>

      <PostPerformanceTable />
    </div>
  );
}

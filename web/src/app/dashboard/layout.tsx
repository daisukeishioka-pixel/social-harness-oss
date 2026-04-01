import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Social Harness — Dashboard",
  description: "SNS統合管理ダッシュボード",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold tracking-tight">
              Social Harness
            </h1>
            <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
              OSS
            </span>
          </div>
          <nav className="flex items-center gap-6 text-sm">
            <a
              href="/dashboard"
              className="text-gray-900 font-medium"
            >
              ダッシュボード
            </a>
            <a
              href="/dashboard/posts"
              className="text-gray-500 hover:text-gray-900"
            >
              投稿管理
            </a>
            <a
              href="/dashboard/scheduler"
              className="text-gray-500 hover:text-gray-900"
            >
              スケジューラー
            </a>
            <a
              href="/dashboard/settings"
              className="text-gray-500 hover:text-gray-900"
            >
              設定
            </a>
          </nav>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
    </div>
  );
}

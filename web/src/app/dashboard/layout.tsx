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
  return <>{children}</>;
}

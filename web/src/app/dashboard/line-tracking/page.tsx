import { LineTrackingSettings } from "@/components/dashboard/line-tracking-settings";

export default function LineTrackingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">LINE導線設定</h2>
        <p className="text-sm text-gray-500 mt-1">
          LINE Harnessと連携するためのトラッキングURLを生成します
        </p>
      </div>

      <LineTrackingSettings />
    </div>
  );
}

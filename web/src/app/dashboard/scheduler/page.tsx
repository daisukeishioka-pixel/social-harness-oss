import { SchedulerCalendar } from "@/components/dashboard/scheduler-calendar";
import { PostComposer } from "@/components/dashboard/post-composer";

export default function SchedulerPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">スケジューラー</h2>
        <p className="text-sm text-gray-500 mt-1">
          予約投稿をカレンダーで管理できます
        </p>
      </div>

      <SchedulerCalendar />
      <PostComposer />
    </div>
  );
}

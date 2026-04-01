import { Card, CardContent } from "@/components/ui/card";

interface MetricCardProps {
  label: string;
  value: string;
  change: number | null;
  description: string;
}

export function MetricCard({ label, value, change, description }: MetricCardProps) {
  return (
    <Card>
      <CardContent className="pt-4 pb-3">
        <p className="text-xs font-medium text-gray-500">{label}</p>
        <div className="mt-1 flex items-baseline gap-2">
          <p className="text-2xl font-semibold tracking-tight">{value}</p>
          {change !== null && (
            <span
              className={`text-xs font-medium ${
                change >= 0 ? "text-green-600" : "text-red-500"
              }`}
            >
              {change >= 0 ? "+" : ""}
              {change}%
            </span>
          )}
        </div>
        <p className="mt-0.5 text-[11px] text-gray-400">{description}</p>
      </CardContent>
    </Card>
  );
}

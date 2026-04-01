"use client";

import Link from "next/link";

const BRAND_COLOR = "#2563EB";

interface MetricCardProps {
  label: string;
  value: string;
  change: number | null;
  description: string;
  icon?: React.ReactNode;
  href?: string;
  accentColor?: string;
}

export function MetricCard({
  label,
  value,
  change,
  description,
  icon,
  href,
  accentColor = BRAND_COLOR,
}: MetricCardProps) {
  const content = (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow group">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-2">{label}</p>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold text-gray-900">{value}</p>
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
          <p className="text-[11px] text-gray-400 mt-1">{description}</p>
        </div>
        {icon && (
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center text-white shrink-0"
            style={{ backgroundColor: accentColor }}
          >
            {icon}
          </div>
        )}
      </div>
      {href && (
        <p className="text-xs text-gray-400 mt-3 group-hover:text-blue-600 transition-colors">
          詳細を見る →
        </p>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    );
  }
  return content;
}

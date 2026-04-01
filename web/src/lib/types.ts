export type PlatformType = "instagram" | "youtube" | "threads" | "tiktok" | "x";

export interface PlatformAccount {
  id: string;
  tenant_id: string;
  platform: PlatformType;
  platform_user_id: string;
  platform_username: string | null;
  display_name: string | null;
  is_active: boolean;
  token_expires_at: string | null;
  created_at: string;
}

export interface Post {
  id: string;
  tenant_id: string;
  platform_account_id: string;
  platform: PlatformType;
  platform_post_id: string;
  post_type: string | null;
  caption: string | null;
  media_url: string | null;
  permalink: string | null;
  published_at: string | null;
}

export interface InsightSnapshot {
  id: string;
  post_id: string;
  platform: PlatformType;
  snapshot_at: string;
  impressions: number | null;
  reach: number | null;
  views: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  saves: number | null;
  clicks: number | null;
  engagement_rate: number | null;
}

export interface AccountMetric {
  id: string;
  platform_account_id: string;
  platform: PlatformType;
  metric_date: string;
  followers: number | null;
  following: number | null;
  total_reach: number | null;
  total_impressions: number | null;
  profile_views: number | null;
}

export interface ScheduledPost {
  id: string;
  tenant_id: string;
  caption: string | null;
  media_urls: string[];
  post_type: string;
  hashtags: string[];
  scheduled_at: string;
  status: "draft" | "scheduled" | "publishing" | "published" | "failed";
  target_platforms: { platform_account_id: string; platform: PlatformType }[];
}

// Platform display config
export const PLATFORM_CONFIG: Record<
  PlatformType,
  { label: string; color: string; bgColor: string }
> = {
  instagram: { label: "Instagram", color: "#E1306C", bgColor: "#FDE8EF" },
  youtube: { label: "YouTube", color: "#FF0000", bgColor: "#FFE5E5" },
  threads: { label: "Threads", color: "#000000", bgColor: "#F0F0F0" },
  tiktok: { label: "TikTok", color: "#00F2EA", bgColor: "#E5FFFE" },
  x: { label: "X", color: "#1DA1F2", bgColor: "#E8F5FD" },
};

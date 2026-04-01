import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getInstagramAccountInsights,
  getThreadsUserInsights,
  getYouTubeChannel,
  getTikTokUser,
  wait,
} from "../lib/platforms";

type Platform = "instagram" | "youtube" | "threads" | "tiktok" | "x";

interface PlatformAccount {
  id: string;
  tenant_id: string;
  platform: Platform;
  platform_user_id: string;
  access_token: string;
  metadata: Record<string, unknown>;
}

/**
 * Collect account-level metrics for all active accounts.
 * Runs daily at 03:00 via Cron Trigger.
 */
export async function collectAccountMetrics(supabase: SupabaseClient) {
  const { data: accounts, error } = await supabase
    .from("platform_accounts")
    .select("id, tenant_id, platform, platform_user_id, access_token, metadata")
    .eq("is_active", true);

  if (error) {
    console.error("Failed to fetch accounts:", error.message);
    return;
  }

  const today = new Date().toISOString().split("T")[0];

  for (const account of (accounts || []) as PlatformAccount[]) {
    try {
      await collectMetricsForAccount(supabase, account, today);
    } catch (err) {
      console.error(
        `[${account.platform}] ${account.platform_user_id} metrics failed:`,
        err
      );
    }
    await wait(1000);
  }
}

async function collectMetricsForAccount(
  supabase: SupabaseClient,
  account: PlatformAccount,
  date: string
) {
  switch (account.platform) {
    case "instagram":
      return collectInstagramMetrics(supabase, account, date);
    case "threads":
      return collectThreadsMetrics(supabase, account, date);
    case "youtube":
      return collectYouTubeMetrics(supabase, account, date);
    case "tiktok":
      return collectTikTokMetrics(supabase, account, date);
    case "x":
      // X account-level metrics are not available via API
      return;
  }
}

async function collectInstagramMetrics(
  supabase: SupabaseClient,
  account: PlatformAccount,
  date: string
) {
  const igAccountId =
    (account.metadata.ig_business_account_id as string) ||
    account.platform_user_id;

  const insights = await getInstagramAccountInsights(
    igAccountId,
    account.access_token
  );

  const metrics: Record<string, number | undefined> = {};
  for (const metric of insights.data || []) {
    metrics[metric.name] = metric.values?.[0]?.value;
  }

  await upsertMetrics(supabase, account, date, {
    followers: metrics.follower_count ?? null,
    total_reach: metrics.reach ?? null,
    total_impressions: metrics.impressions ?? null,
    profile_views: metrics.profile_views ?? null,
  });
}

async function collectThreadsMetrics(
  supabase: SupabaseClient,
  account: PlatformAccount,
  date: string
) {
  const insights = await getThreadsUserInsights(
    account.access_token,
    account.platform_user_id
  );

  const metrics: Record<string, number | undefined> = {};
  for (const metric of insights.data || []) {
    metrics[metric.name] = metric.values?.[0]?.value;
  }

  await upsertMetrics(supabase, account, date, {
    followers: metrics.followers_count ?? null,
    total_reach: metrics.views ?? null,
  });
}

async function collectYouTubeMetrics(
  supabase: SupabaseClient,
  account: PlatformAccount,
  date: string
) {
  const channelData = await getYouTubeChannel(account.access_token);
  const channel = channelData.items?.[0];
  if (!channel) return;

  await upsertMetrics(supabase, account, date, {
    followers: Number(channel.statistics.subscriberCount) || null,
    total_impressions: Number(channel.statistics.viewCount) || null,
  }, {
    video_count: channel.statistics.videoCount,
  });
}

async function collectTikTokMetrics(
  supabase: SupabaseClient,
  account: PlatformAccount,
  date: string
) {
  const user = await getTikTokUser(account.access_token);

  await upsertMetrics(supabase, account, date, {
    followers: user.follower_count ?? null,
    following: user.following_count ?? null,
  }, {
    likes_count: user.likes_count,
    video_count: user.video_count,
  });
}

async function upsertMetrics(
  supabase: SupabaseClient,
  account: PlatformAccount,
  date: string,
  metrics: {
    followers?: number | null;
    following?: number | null;
    total_reach?: number | null;
    total_impressions?: number | null;
    profile_views?: number | null;
  },
  extra?: Record<string, unknown>
) {
  const { error } = await supabase.from("account_metrics").upsert(
    {
      tenant_id: account.tenant_id,
      platform_account_id: account.id,
      platform: account.platform,
      metric_date: date,
      ...metrics,
      extra: extra ?? {},
    },
    { onConflict: "platform_account_id,metric_date" }
  );

  if (error) {
    console.error("Metrics upsert failed:", error.message);
  }
}

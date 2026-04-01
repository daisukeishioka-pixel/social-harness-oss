import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getInstagramMedia,
  getInstagramMediaInsights,
  getThreadsPosts,
  getThreadsPostInsights,
  getYouTubeVideos,
  getTikTokVideos,
  getXTweets,
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
 * Collect post-level insights for all active accounts.
 * Runs every hour via Cron Trigger.
 */
export async function collectInsights(supabase: SupabaseClient) {
  const { data: accounts, error } = await supabase
    .from("platform_accounts")
    .select("id, tenant_id, platform, platform_user_id, access_token, metadata")
    .eq("is_active", true);

  if (error) {
    console.error("Failed to fetch accounts:", error.message);
    return;
  }

  for (const account of (accounts || []) as PlatformAccount[]) {
    try {
      await collectForAccount(supabase, account);
    } catch (err) {
      console.error(
        `[${account.platform}] ${account.platform_user_id} insights failed:`,
        err
      );
    }
    await wait(1000);
  }
}

async function collectForAccount(
  supabase: SupabaseClient,
  account: PlatformAccount
) {
  switch (account.platform) {
    case "instagram":
      return collectInstagram(supabase, account);
    case "threads":
      return collectThreads(supabase, account);
    case "youtube":
      return collectYouTube(supabase, account);
    case "tiktok":
      return collectTikTok(supabase, account);
    case "x":
      return collectX(supabase, account);
  }
}

// ---- Instagram ----
async function collectInstagram(
  supabase: SupabaseClient,
  account: PlatformAccount
) {
  const igAccountId =
    (account.metadata.ig_business_account_id as string) ||
    account.platform_user_id;

  const mediaData = await getInstagramMedia(igAccountId, account.access_token);
  const posts = mediaData.data || [];

  for (const post of posts) {
    const postId = post.id as string;
    // Ensure post exists in posts table
    const dbPost = await upsertPost(supabase, account, {
      platform_post_id: postId,
      post_type: (post.media_type as string)?.toLowerCase(),
      caption: post.caption as string | undefined,
      media_url: post.media_url as string | undefined,
      permalink: post.permalink as string | undefined,
      published_at: post.timestamp as string | undefined,
    });
    if (!dbPost) continue;

    try {
      const insights = await getInstagramMediaInsights(
        postId,
        account.access_token
      );
      const metrics = parseInsightsData(insights.data);

      await upsertSnapshot(supabase, account, dbPost.id, {
        impressions: metrics.impressions,
        reach: metrics.reach,
        likes: metrics.likes ?? (post.like_count as number | undefined),
        comments: metrics.comments ?? (post.comments_count as number | undefined),
        shares: metrics.shares,
        saves: metrics.saved,
      });
    } catch {
      // Some media types don't support insights (e.g., stories expired)
    }

    await wait(500);
  }
}

// ---- Threads ----
async function collectThreads(
  supabase: SupabaseClient,
  account: PlatformAccount
) {
  const postsData = await getThreadsPosts(
    account.access_token,
    account.platform_user_id
  );
  const posts = postsData.data || [];

  for (const post of posts) {
    const postId = post.id as string;
    const dbPost = await upsertPost(supabase, account, {
      platform_post_id: postId,
      post_type: (post.media_type as string)?.toLowerCase() || "text",
      caption: post.text as string | undefined,
      media_url: post.media_url as string | undefined,
      permalink: post.permalink as string | undefined,
      published_at: post.timestamp as string | undefined,
    });
    if (!dbPost) continue;

    try {
      const insights = await getThreadsPostInsights(
        account.access_token,
        postId
      );
      const metrics = parseInsightsData(insights.data);

      await upsertSnapshot(supabase, account, dbPost.id, {
        views: metrics.views,
        likes: metrics.likes,
        comments: metrics.replies,
        shares: metrics.shares,
      }, {
        reposts: metrics.reposts,
        quotes: metrics.quotes,
      });
    } catch {
      // Some posts may not have insights
    }

    await wait(500);
  }
}

// ---- YouTube ----
async function collectYouTube(
  supabase: SupabaseClient,
  account: PlatformAccount
) {
  const channelId =
    (account.metadata.channel_id as string) || account.platform_user_id;

  const videosData = await getYouTubeVideos(
    account.access_token,
    channelId
  );
  const videos = videosData.items || [];

  for (const video of videos) {
    const dbPost = await upsertPost(supabase, account, {
      platform_post_id: video.id,
      post_type: "video",
      caption: video.snippet.title,
      media_url: video.snippet.thumbnails?.default?.url,
      permalink: `https://www.youtube.com/watch?v=${video.id}`,
      published_at: video.snippet.publishedAt,
    });
    if (!dbPost) continue;

    await upsertSnapshot(supabase, account, dbPost.id, {
      views: Number(video.statistics.viewCount) || null,
      likes: Number(video.statistics.likeCount) || null,
      comments: Number(video.statistics.commentCount) || null,
    });

    await wait(200);
  }
}

// ---- TikTok ----
async function collectTikTok(
  supabase: SupabaseClient,
  account: PlatformAccount
) {
  const videosData = await getTikTokVideos(account.access_token);
  const videos = videosData.videos || [];

  for (const video of videos) {
    const dbPost = await upsertPost(supabase, account, {
      platform_post_id: video.id,
      post_type: "video",
      caption: video.title,
      media_url: video.cover_image_url,
      permalink: video.share_url,
      published_at: new Date(video.create_time * 1000).toISOString(),
    });
    if (!dbPost) continue;

    await upsertSnapshot(supabase, account, dbPost.id, {
      views: video.view_count,
      likes: video.like_count,
      comments: video.comment_count,
      shares: video.share_count,
    });

    await wait(200);
  }
}

// ---- X ----
async function collectX(
  supabase: SupabaseClient,
  account: PlatformAccount
) {
  const tweetsData = await getXTweets(
    account.access_token,
    account.platform_user_id
  );
  const tweets = tweetsData.data || [];

  for (const tweet of tweets) {
    const dbPost = await upsertPost(supabase, account, {
      platform_post_id: tweet.id,
      post_type: "text",
      caption: tweet.text,
      published_at: tweet.created_at,
      permalink: `https://twitter.com/i/status/${tweet.id}`,
    });
    if (!dbPost) continue;

    const m = tweet.public_metrics;
    await upsertSnapshot(supabase, account, dbPost.id, {
      impressions: m.impression_count,
      likes: m.like_count,
      comments: m.reply_count,
      shares: m.retweet_count,
    }, {
      quotes: m.quote_count,
    });

    await wait(200);
  }
}

// ============================================================
// Helpers
// ============================================================

interface PostInput {
  platform_post_id: string;
  post_type?: string;
  caption?: string;
  media_url?: string;
  permalink?: string;
  published_at?: string;
}

async function upsertPost(
  supabase: SupabaseClient,
  account: PlatformAccount,
  input: PostInput
): Promise<{ id: string } | null> {
  const { data, error } = await supabase
    .from("posts")
    .upsert(
      {
        tenant_id: account.tenant_id,
        platform_account_id: account.id,
        platform: account.platform,
        platform_post_id: input.platform_post_id,
        post_type: input.post_type,
        caption: input.caption,
        media_url: input.media_url,
        permalink: input.permalink,
        published_at: input.published_at,
      },
      { onConflict: "platform,platform_post_id" }
    )
    .select("id")
    .single();

  if (error) {
    console.error("Post upsert failed:", error.message);
    return null;
  }
  return data;
}

interface SnapshotMetrics {
  impressions?: number | null;
  reach?: number | null;
  views?: number | null;
  likes?: number | null;
  comments?: number | null;
  shares?: number | null;
  saves?: number | null;
  clicks?: number | null;
}

async function upsertSnapshot(
  supabase: SupabaseClient,
  account: PlatformAccount,
  postId: string,
  metrics: SnapshotMetrics,
  extra?: Record<string, unknown>
) {
  const totalEngagements =
    (metrics.likes ?? 0) +
    (metrics.comments ?? 0) +
    (metrics.shares ?? 0) +
    (metrics.saves ?? 0);
  const base = metrics.impressions ?? metrics.reach ?? metrics.views ?? 0;
  const engagementRate =
    base > 0 ? Number((totalEngagements / base).toFixed(4)) : null;

  const { error } = await supabase.from("insights_snapshots").upsert(
    {
      tenant_id: account.tenant_id,
      post_id: postId,
      platform: account.platform,
      snapshot_at: new Date().toISOString(),
      ...metrics,
      engagement_rate: engagementRate,
      extra: extra ?? {},
    },
    { onConflict: "post_id,date_trunc_hour_immutable" as never }
  );

  if (error) {
    // Unique constraint on (post_id, hour) - expected if already collected this hour
    if (!error.message.includes("duplicate") && !error.message.includes("unique")) {
      console.error("Snapshot upsert failed:", error.message);
    }
  }
}

function parseInsightsData(
  data: Array<{ name: string; values: Array<{ value: number }> }>
): Record<string, number | undefined> {
  const result: Record<string, number | undefined> = {};
  for (const metric of data) {
    result[metric.name] = metric.values?.[0]?.value;
  }
  return result;
}

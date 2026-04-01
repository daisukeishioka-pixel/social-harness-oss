/**
 * Lightweight platform API functions for Cloudflare Workers.
 * Only includes read/insight functions needed by cron jobs.
 */

// ============================================================
// Instagram
// ============================================================

const GRAPH_API_BASE = "https://graph.facebook.com/v22.0";

export async function getInstagramMedia(
  igAccountId: string,
  token: string,
  limit = 25
) {
  const params = new URLSearchParams({
    fields:
      "id,caption,media_type,media_url,permalink,thumbnail_url,timestamp,like_count,comments_count",
    limit: String(limit),
    access_token: token,
  });
  const res = await fetch(`${GRAPH_API_BASE}/${igAccountId}/media?${params}`);
  if (!res.ok) throw new Error(`IG media fetch failed: ${res.status}`);
  return res.json() as Promise<{ data: Array<Record<string, unknown>> }>;
}

export async function getInstagramMediaInsights(
  mediaId: string,
  token: string
) {
  const params = new URLSearchParams({
    metric: "impressions,reach,likes,comments,shares,saved",
    access_token: token,
  });
  const res = await fetch(`${GRAPH_API_BASE}/${mediaId}/insights?${params}`);
  if (!res.ok) throw new Error(`IG media insights failed: ${res.status}`);
  return res.json() as Promise<{ data: Array<{ name: string; values: Array<{ value: number }> }> }>;
}

export async function getInstagramAccountInsights(
  igAccountId: string,
  token: string
) {
  const params = new URLSearchParams({
    metric: "impressions,reach,profile_views,follower_count",
    period: "day",
    access_token: token,
  });
  const res = await fetch(`${GRAPH_API_BASE}/${igAccountId}/insights?${params}`);
  if (!res.ok) throw new Error(`IG account insights failed: ${res.status}`);
  return res.json() as Promise<{ data: Array<{ name: string; values: Array<{ value: number }> }> }>;
}

export async function refreshInstagramToken(
  longLivedToken: string,
  appId: string,
  appSecret: string
) {
  const params = new URLSearchParams({
    grant_type: "fb_exchange_token",
    client_id: appId,
    client_secret: appSecret,
    fb_exchange_token: longLivedToken,
  });
  const res = await fetch(`${GRAPH_API_BASE}/oauth/access_token?${params}`);
  if (!res.ok) throw new Error(`IG token refresh failed: ${res.status}`);
  return res.json() as Promise<{
    access_token: string;
    token_type: string;
    expires_in: number;
  }>;
}

// ============================================================
// Threads
// ============================================================

const THREADS_API_BASE = "https://graph.threads.net/v1.0";
const THREADS_OAUTH_BASE = "https://graph.threads.net/oauth";

export async function getThreadsPosts(
  token: string,
  userId: string,
  limit = 25
) {
  const params = new URLSearchParams({
    fields:
      "id,media_product_type,media_type,media_url,permalink,username,text,timestamp",
    limit: String(limit),
    access_token: token,
  });
  const res = await fetch(`${THREADS_API_BASE}/${userId}/threads?${params}`);
  if (!res.ok) throw new Error(`Threads posts fetch failed: ${res.status}`);
  return res.json() as Promise<{ data: Array<Record<string, unknown>> }>;
}

export async function getThreadsPostInsights(
  token: string,
  mediaId: string
) {
  const params = new URLSearchParams({
    metric: "views,likes,replies,reposts,quotes,shares",
    access_token: token,
  });
  const res = await fetch(`${THREADS_API_BASE}/${mediaId}/insights?${params}`);
  if (!res.ok) throw new Error(`Threads insights failed: ${res.status}`);
  return res.json() as Promise<{ data: Array<{ name: string; values: Array<{ value: number }> }> }>;
}

export async function getThreadsUserInsights(
  token: string,
  userId: string
) {
  const params = new URLSearchParams({
    metric: "views,likes,replies,reposts,quotes,followers_count",
    access_token: token,
  });
  const res = await fetch(`${THREADS_API_BASE}/${userId}/threads_insights?${params}`);
  if (!res.ok) throw new Error(`Threads user insights failed: ${res.status}`);
  return res.json() as Promise<{ data: Array<{ name: string; values: Array<{ value: number }> }> }>;
}

export async function refreshThreadsToken(token: string) {
  const params = new URLSearchParams({
    grant_type: "th_refresh_token",
    access_token: token,
  });
  const res = await fetch(`${THREADS_OAUTH_BASE}/access_token?${params}`);
  if (!res.ok) throw new Error(`Threads token refresh failed: ${res.status}`);
  return res.json() as Promise<{
    access_token: string;
    token_type: string;
    expires_in: number;
  }>;
}

// ============================================================
// YouTube
// ============================================================

const YT_API_BASE = "https://www.googleapis.com/youtube/v3";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

export async function getYouTubeChannel(token: string) {
  const params = new URLSearchParams({
    part: "snippet,statistics",
    mine: "true",
    access_token: token,
  });
  const res = await fetch(`${YT_API_BASE}/channels?${params}`);
  if (!res.ok) throw new Error(`YT channel fetch failed: ${res.status}`);
  return res.json() as Promise<{
    items: Array<{
      id: string;
      statistics: {
        subscriberCount: string;
        viewCount: string;
        videoCount: string;
      };
    }>;
  }>;
}

export interface YTVideo {
  id: string;
  snippet: {
    title: string;
    publishedAt: string;
    thumbnails: Record<string, { url: string }>;
  };
  statistics: {
    viewCount: string;
    likeCount: string;
    commentCount: string;
  };
}

type YTVideosResponse = { items: YTVideo[] };

export async function getYouTubeVideos(
  token: string,
  channelId: string,
  maxResults = 25
) {
  const searchParams = new URLSearchParams({
    part: "snippet",
    channelId,
    order: "date",
    type: "video",
    maxResults: String(maxResults),
    access_token: token,
  });
  const searchRes = await fetch(`${YT_API_BASE}/search?${searchParams}`);
  if (!searchRes.ok) throw new Error(`YT search failed: ${searchRes.status}`);
  const searchData = await searchRes.json() as {
    items: Array<{ id: { videoId: string } }>;
  };

  const videoIds = searchData.items.map((item) => item.id.videoId).join(",");
  if (!videoIds) return { items: [] } as YTVideosResponse;

  const videoParams = new URLSearchParams({
    part: "snippet,statistics,contentDetails",
    id: videoIds,
    access_token: token,
  });
  const videoRes = await fetch(`${YT_API_BASE}/videos?${videoParams}`);
  if (!videoRes.ok) throw new Error(`YT videos fetch failed: ${videoRes.status}`);
  return videoRes.json() as Promise<YTVideosResponse>;
}

export async function refreshYouTubeToken(
  refreshToken: string,
  clientId: string,
  clientSecret: string
) {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) throw new Error(`YT token refresh failed: ${res.status}`);
  return res.json() as Promise<{
    access_token: string;
    expires_in: number;
  }>;
}

// ============================================================
// TikTok
// ============================================================

const TIKTOK_API_BASE = "https://open.tiktokapis.com/v2";

export interface TikTokVideo {
  id: string;
  title: string;
  cover_image_url: string;
  share_url: string;
  create_time: number;
  like_count: number;
  comment_count: number;
  share_count: number;
  view_count: number;
}

export async function getTikTokVideos(token: string, maxCount = 20) {
  const res = await fetch(`${TIKTOK_API_BASE}/video/list/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ max_count: maxCount }),
  });
  if (!res.ok) throw new Error(`TikTok video list failed: ${res.status}`);
  const data = await res.json() as {
    data: { videos: TikTokVideo[]; cursor: number; has_more: boolean };
  };
  return data.data;
}

export async function getTikTokUser(token: string) {
  const res = await fetch(`${TIKTOK_API_BASE}/user/info/`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`TikTok user info failed: ${res.status}`);
  const data = await res.json() as {
    data: {
      user: {
        open_id: string;
        display_name: string;
        follower_count: number;
        following_count: number;
        likes_count: number;
        video_count: number;
      };
    };
  };
  return data.data.user;
}

export async function refreshTikTokToken(
  refreshToken: string,
  clientKey: string,
  clientSecret: string
) {
  const res = await fetch(`${TIKTOK_API_BASE}/oauth/token/`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_key: clientKey,
      client_secret: clientSecret,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });
  if (!res.ok) throw new Error(`TikTok token refresh failed: ${res.status}`);
  const data = await res.json() as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    refresh_expires_in: number;
    open_id: string;
  };
  return data;
}

// ============================================================
// X (optional)
// ============================================================

const X_API_BASE = "https://api.twitter.com/2";

export async function getXTweets(
  bearerToken: string,
  userId: string,
  maxResults = 10
) {
  const params = new URLSearchParams({
    "tweet.fields": "id,text,created_at,public_metrics",
    max_results: String(maxResults),
    exclude: "retweets,replies",
  });
  const res = await fetch(`${X_API_BASE}/users/${userId}/tweets?${params}`, {
    headers: { Authorization: `Bearer ${bearerToken}` },
  });
  if (!res.ok) throw new Error(`X tweets fetch failed: ${res.status}`);
  return res.json() as Promise<{
    data: Array<{
      id: string;
      text: string;
      created_at: string;
      public_metrics: {
        like_count: number;
        retweet_count: number;
        reply_count: number;
        quote_count: number;
        impression_count: number;
      };
    }>;
  }>;
}

// ============================================================
// Helpers
// ============================================================

/** Wait between API calls to respect rate limits */
export function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

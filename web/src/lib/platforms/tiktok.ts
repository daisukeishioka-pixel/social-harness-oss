/**
 * TikTok API integration
 *
 * Uses TikTok Login Kit (OAuth 2.0) + Content Posting API + Video Insights.
 * API docs: https://developers.tiktok.com/doc/overview/
 *
 * Token lifespan: access_token 24h, refresh_token 365 days.
 * Rate limit: varies by endpoint (generally generous for read operations).
 */

const TIKTOK_AUTH_BASE = "https://www.tiktok.com/v2/auth/authorize";
const TIKTOK_API_BASE = "https://open.tiktokapis.com/v2";

// ============================================================
// OAuth
// ============================================================

export function getTikTokAuthUrl(
  redirectUri: string,
  clientKey: string,
  state?: string
) {
  const params = new URLSearchParams({
    client_key: clientKey,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "user.info.basic,user.info.stats,video.list,video.publish,video.upload",
    state: state || "",
  });
  return `${TIKTOK_AUTH_BASE}/?${params}`;
}

export async function exchangeTikTokCode(
  code: string,
  redirectUri: string,
  clientKey: string,
  clientSecret: string
) {
  const res = await fetch(`${TIKTOK_API_BASE}/oauth/token/`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_key: clientKey,
      client_secret: clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    }),
  });
  if (!res.ok) throw new Error(`TikTok token exchange failed: ${res.status}`);
  const data = await res.json();
  if (data.error) throw new Error(`TikTok token error: ${data.error}`);
  return data as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    refresh_expires_in: number;
    open_id: string;
    token_type: string;
  };
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
  const data = await res.json();
  if (data.error) throw new Error(`TikTok refresh error: ${data.error}`);
  return data as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    refresh_expires_in: number;
    open_id: string;
  };
}

// ============================================================
// User Info
// ============================================================

export async function getTikTokUser(token: string) {
  const res = await fetch(`${TIKTOK_API_BASE}/user/info/`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`TikTok user info failed: ${res.status}`);
  const data = await res.json();
  return data.data?.user as {
    open_id: string;
    union_id: string;
    display_name: string;
    avatar_url: string;
    follower_count: number;
    following_count: number;
    likes_count: number;
    video_count: number;
  };
}

// ============================================================
// Video List & Insights
// ============================================================

export async function getTikTokVideos(
  token: string,
  maxCount = 20,
  cursor?: number
) {
  const body: Record<string, unknown> = { max_count: maxCount };
  if (cursor) body.cursor = cursor;

  const res = await fetch(`${TIKTOK_API_BASE}/video/list/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`TikTok video list failed: ${res.status}`);
  const data = await res.json();
  return data.data as {
    videos: Array<{
      id: string;
      title: string;
      cover_image_url: string;
      share_url: string;
      create_time: number;
      like_count: number;
      comment_count: number;
      share_count: number;
      view_count: number;
      duration: number;
    }>;
    cursor: number;
    has_more: boolean;
  };
}

export async function getTikTokVideoInsights(
  token: string,
  videoIds: string[]
) {
  const res = await fetch(`${TIKTOK_API_BASE}/video/query/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      filters: { video_ids: videoIds },
      fields: [
        "id",
        "title",
        "like_count",
        "comment_count",
        "share_count",
        "view_count",
        "create_time",
        "cover_image_url",
        "share_url",
        "duration",
      ],
    }),
  });
  if (!res.ok)
    throw new Error(`TikTok video query failed: ${res.status}`);
  const data = await res.json();
  return data.data as {
    videos: Array<{
      id: string;
      title: string;
      like_count: number;
      comment_count: number;
      share_count: number;
      view_count: number;
      create_time: number;
      cover_image_url: string;
      share_url: string;
    }>;
  };
}

// ============================================================
// Content Posting
// ============================================================

/**
 * Initialize a video upload (direct post).
 * After calling this, upload the video chunk to the returned upload_url,
 * then call publishTikTokVideo to finalize.
 */
export async function initTikTokVideoUpload(
  token: string,
  options: {
    title: string;
    privacy_level: "PUBLIC_TO_EVERYONE" | "MUTUAL_FOLLOW_FRIENDS" | "FOLLOWER_OF_CREATOR" | "SELF_ONLY";
    video_size: number;
    chunk_size: number;
    total_chunk_count: number;
    disable_comment?: boolean;
    disable_duet?: boolean;
    disable_stitch?: boolean;
  }
) {
  const res = await fetch(
    `${TIKTOK_API_BASE}/post/publish/video/init/`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        post_info: {
          title: options.title,
          privacy_level: options.privacy_level,
          disable_comment: options.disable_comment ?? false,
          disable_duet: options.disable_duet ?? false,
          disable_stitch: options.disable_stitch ?? false,
        },
        source_info: {
          source: "FILE_UPLOAD",
          video_size: options.video_size,
          chunk_size: options.chunk_size,
          total_chunk_count: options.total_chunk_count,
        },
      }),
    }
  );
  if (!res.ok)
    throw new Error(`TikTok video init failed: ${res.status}`);
  const data = await res.json();
  return data.data as {
    publish_id: string;
    upload_url: string;
  };
}

/**
 * Check the status of a video publish.
 */
export async function getTikTokPublishStatus(
  token: string,
  publishId: string
) {
  const res = await fetch(
    `${TIKTOK_API_BASE}/post/publish/status/fetch/`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ publish_id: publishId }),
    }
  );
  if (!res.ok)
    throw new Error(`TikTok publish status failed: ${res.status}`);
  const data = await res.json();
  return data.data as {
    status: "PROCESSING_UPLOAD" | "PROCESSING_DOWNLOAD" | "PUBLISH_COMPLETE" | "FAILED";
    publicaly_available_post_id?: string[];
    fail_reason?: string;
  };
}

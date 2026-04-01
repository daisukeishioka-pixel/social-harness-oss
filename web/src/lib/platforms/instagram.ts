const GRAPH_API_BASE = "https://graph.facebook.com/v22.0";

// Generate OAuth authorization URL (Facebook Login flow)
export function getInstagramAuthUrl(redirectUri: string, appId: string) {
  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    scope:
      "instagram_basic,instagram_manage_insights,instagram_content_publish,pages_show_list,pages_read_engagement",
    response_type: "code",
  });
  return `https://www.facebook.com/v22.0/dialog/oauth?${params}`;
}

// Exchange auth code for short-lived token
export async function exchangeInstagramCode(
  code: string,
  redirectUri: string,
  appId: string,
  appSecret: string
) {
  const params = new URLSearchParams({
    client_id: appId,
    client_secret: appSecret,
    redirect_uri: redirectUri,
    code,
  });
  const res = await fetch(
    `${GRAPH_API_BASE}/oauth/access_token?${params}`
  );
  if (!res.ok) throw new Error(`IG token exchange failed: ${res.status}`);
  return res.json() as Promise<{ access_token: string }>;
}

// Exchange for long-lived token (60 days)
export async function getLongLivedInstagramToken(
  shortLivedToken: string,
  appId: string,
  appSecret: string
) {
  const params = new URLSearchParams({
    grant_type: "fb_exchange_token",
    client_id: appId,
    client_secret: appSecret,
    fb_exchange_token: shortLivedToken,
  });
  const res = await fetch(
    `${GRAPH_API_BASE}/oauth/access_token?${params}`
  );
  if (!res.ok)
    throw new Error(`IG long-lived token failed: ${res.status}`);
  return res.json() as Promise<{
    access_token: string;
    token_type: string;
    expires_in: number;
  }>;
}

// Get connected Facebook Pages
export async function getFacebookPages(token: string) {
  const res = await fetch(
    `${GRAPH_API_BASE}/me/accounts?fields=id,name,access_token,instagram_business_account&access_token=${token}`
  );
  if (!res.ok) throw new Error(`FB pages fetch failed: ${res.status}`);
  return res.json();
}

// Get Instagram Business Account from a Facebook Page
export async function getInstagramAccount(pageId: string, pageToken: string) {
  const res = await fetch(
    `${GRAPH_API_BASE}/${pageId}?fields=instagram_business_account{id,username,name,profile_picture_url,followers_count,media_count}&access_token=${pageToken}`
  );
  if (!res.ok) throw new Error(`IG account fetch failed: ${res.status}`);
  return res.json();
}

// Get user media (posts)
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
  const res = await fetch(
    `${GRAPH_API_BASE}/${igAccountId}/media?${params}`
  );
  if (!res.ok) throw new Error(`IG media fetch failed: ${res.status}`);
  return res.json();
}

// Get media insights
export async function getInstagramMediaInsights(
  mediaId: string,
  token: string
) {
  const params = new URLSearchParams({
    metric: "impressions,reach,likes,comments,shares,saved",
    access_token: token,
  });
  const res = await fetch(
    `${GRAPH_API_BASE}/${mediaId}/insights?${params}`
  );
  if (!res.ok)
    throw new Error(`IG media insights failed: ${res.status}`);
  return res.json();
}

// Get account-level insights
export async function getInstagramAccountInsights(
  igAccountId: string,
  token: string,
  period: "day" | "week" | "days_28" = "day",
  since?: number,
  until?: number
) {
  const params = new URLSearchParams({
    metric: "impressions,reach,profile_views,follower_count",
    period,
    access_token: token,
  });
  if (since) params.set("since", String(since));
  if (until) params.set("until", String(until));

  const res = await fetch(
    `${GRAPH_API_BASE}/${igAccountId}/insights?${params}`
  );
  if (!res.ok)
    throw new Error(`IG account insights failed: ${res.status}`);
  return res.json();
}

// Publish a photo
export async function publishInstagramPhoto(
  igAccountId: string,
  token: string,
  imageUrl: string,
  caption: string
) {
  // Step 1: Create container
  const containerRes = await fetch(
    `${GRAPH_API_BASE}/${igAccountId}/media`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        image_url: imageUrl,
        caption,
        access_token: token,
      }),
    }
  );
  if (!containerRes.ok)
    throw new Error(`IG container creation failed: ${containerRes.status}`);
  const { id: containerId } = await containerRes.json();

  // Step 2: Publish
  const publishRes = await fetch(
    `${GRAPH_API_BASE}/${igAccountId}/media_publish`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        creation_id: containerId,
        access_token: token,
      }),
    }
  );
  if (!publishRes.ok)
    throw new Error(`IG publish failed: ${publishRes.status}`);
  return publishRes.json();
}

// Publish a reel
export async function publishInstagramReel(
  igAccountId: string,
  token: string,
  videoUrl: string,
  caption: string
) {
  // Step 1: Create container
  const containerRes = await fetch(
    `${GRAPH_API_BASE}/${igAccountId}/media`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        video_url: videoUrl,
        caption,
        media_type: "REELS",
        access_token: token,
      }),
    }
  );
  if (!containerRes.ok)
    throw new Error(`IG reel container failed: ${containerRes.status}`);
  const { id: containerId } = await containerRes.json();

  // Step 2: Wait for processing then publish
  // Note: Video processing can take time. In production, poll the container status.
  const publishRes = await fetch(
    `${GRAPH_API_BASE}/${igAccountId}/media_publish`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        creation_id: containerId,
        access_token: token,
      }),
    }
  );
  if (!publishRes.ok)
    throw new Error(`IG reel publish failed: ${publishRes.status}`);
  return publishRes.json();
}

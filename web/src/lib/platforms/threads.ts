const THREADS_API_BASE = "https://graph.threads.net/v1.0";
const THREADS_OAUTH_BASE = "https://graph.threads.net/oauth";

// Generate OAuth authorization URL
export function getThreadsAuthUrl(redirectUri: string, appId: string) {
  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    scope: "threads_basic,threads_content_publish,threads_manage_insights",
    response_type: "code",
  });
  return `https://threads.net/oauth/authorize?${params}`;
}

// Exchange auth code for short-lived token
export async function exchangeThreadsCode(
  code: string,
  redirectUri: string,
  appId: string,
  appSecret: string
) {
  const res = await fetch(`${THREADS_OAUTH_BASE}/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: appId,
      client_secret: appSecret,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
      code,
    }),
  });
  if (!res.ok) throw new Error(`Threads token exchange failed: ${res.status}`);
  return res.json() as Promise<{ access_token: string; user_id: string }>;
}

// Exchange short-lived token for long-lived token (60 days)
export async function getLongLivedThreadsToken(
  shortLivedToken: string,
  appSecret: string
) {
  const params = new URLSearchParams({
    grant_type: "th_exchange_token",
    client_secret: appSecret,
    access_token: shortLivedToken,
  });
  const res = await fetch(
    `${THREADS_OAUTH_BASE}/access_token?${params}`
  );
  if (!res.ok) throw new Error(`Threads long-lived token failed: ${res.status}`);
  return res.json() as Promise<{
    access_token: string;
    token_type: string;
    expires_in: number;
  }>;
}

// Refresh long-lived token
export async function refreshThreadsToken(token: string) {
  const params = new URLSearchParams({
    grant_type: "th_refresh_token",
    access_token: token,
  });
  const res = await fetch(
    `${THREADS_OAUTH_BASE}/access_token?${params}`
  );
  if (!res.ok) throw new Error(`Threads token refresh failed: ${res.status}`);
  return res.json() as Promise<{
    access_token: string;
    token_type: string;
    expires_in: number;
  }>;
}

// Get user profile
export async function getThreadsProfile(token: string, userId: string) {
  const params = new URLSearchParams({
    fields: "id,username,name,threads_profile_picture_url,threads_biography",
    access_token: token,
  });
  const res = await fetch(`${THREADS_API_BASE}/${userId}?${params}`);
  if (!res.ok) throw new Error(`Threads profile fetch failed: ${res.status}`);
  return res.json();
}

// Get user's threads (posts)
export async function getThreadsPosts(
  token: string,
  userId: string,
  limit = 25
) {
  const params = new URLSearchParams({
    fields:
      "id,media_product_type,media_type,media_url,permalink,owner,username,text,timestamp,shortcode,thumbnail_url,children,is_quote_post",
    limit: String(limit),
    access_token: token,
  });
  const res = await fetch(
    `${THREADS_API_BASE}/${userId}/threads?${params}`
  );
  if (!res.ok) throw new Error(`Threads posts fetch failed: ${res.status}`);
  return res.json();
}

// Get media insights
export async function getThreadsPostInsights(
  token: string,
  mediaId: string
) {
  const params = new URLSearchParams({
    metric: "views,likes,replies,reposts,quotes,shares",
    access_token: token,
  });
  const res = await fetch(
    `${THREADS_API_BASE}/${mediaId}/insights?${params}`
  );
  if (!res.ok) throw new Error(`Threads insights fetch failed: ${res.status}`);
  return res.json();
}

// Get user-level insights
export async function getThreadsUserInsights(
  token: string,
  userId: string,
  since?: number,
  until?: number
) {
  const params = new URLSearchParams({
    metric: "views,likes,replies,reposts,quotes,followers_count",
    access_token: token,
  });
  if (since) params.set("since", String(since));
  if (until) params.set("until", String(until));

  const res = await fetch(
    `${THREADS_API_BASE}/${userId}/threads_insights?${params}`
  );
  if (!res.ok)
    throw new Error(`Threads user insights fetch failed: ${res.status}`);
  return res.json();
}

// Publish a thread
export async function publishThread(
  token: string,
  userId: string,
  text: string,
  mediaUrl?: string,
  mediaType?: "IMAGE" | "VIDEO"
) {
  // Step 1: Create media container
  const containerParams: Record<string, string> = {
    text,
    media_type: mediaType || "TEXT",
    access_token: token,
  };
  if (mediaUrl && mediaType === "IMAGE") {
    containerParams.image_url = mediaUrl;
  }
  if (mediaUrl && mediaType === "VIDEO") {
    containerParams.video_url = mediaUrl;
  }

  const containerRes = await fetch(
    `${THREADS_API_BASE}/${userId}/threads`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(containerParams),
    }
  );
  if (!containerRes.ok)
    throw new Error(`Threads container creation failed: ${containerRes.status}`);
  const { id: containerId } = await containerRes.json();

  // Step 2: Publish
  const publishRes = await fetch(
    `${THREADS_API_BASE}/${userId}/threads_publish`,
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
    throw new Error(`Threads publish failed: ${publishRes.status}`);
  return publishRes.json();
}

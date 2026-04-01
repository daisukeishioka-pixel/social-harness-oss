const YT_API_BASE = "https://www.googleapis.com/youtube/v3";
const YT_ANALYTICS_BASE = "https://youtubeanalytics.googleapis.com/v2";
const GOOGLE_OAUTH_BASE = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

// Generate OAuth authorization URL
export function getYouTubeAuthUrl(redirectUri: string, clientId: string) {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: [
      "https://www.googleapis.com/auth/youtube.readonly",
      "https://www.googleapis.com/auth/youtube.upload",
      "https://www.googleapis.com/auth/yt-analytics.readonly",
    ].join(" "),
    access_type: "offline",
    prompt: "consent",
  });
  return `${GOOGLE_OAUTH_BASE}?${params}`;
}

// Exchange auth code for tokens
export async function exchangeYouTubeCode(
  code: string,
  redirectUri: string,
  clientId: string,
  clientSecret: string
) {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) throw new Error(`YT token exchange failed: ${res.status}`);
  return res.json() as Promise<{
    access_token: string;
    refresh_token: string;
    expires_in: number;
    token_type: string;
  }>;
}

// Refresh access token
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

// Get channel info
export async function getYouTubeChannel(token: string) {
  const params = new URLSearchParams({
    part: "snippet,statistics",
    mine: "true",
    access_token: token,
  });
  const res = await fetch(`${YT_API_BASE}/channels?${params}`);
  if (!res.ok) throw new Error(`YT channel fetch failed: ${res.status}`);
  return res.json();
}

// Get channel videos
export async function getYouTubeVideos(
  token: string,
  channelId: string,
  maxResults = 25
) {
  // Step 1: Search for videos
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
  const searchData = await searchRes.json();

  const videoIds = searchData.items
    .map((item: { id: { videoId: string } }) => item.id.videoId)
    .join(",");

  if (!videoIds) return { items: [] };

  // Step 2: Get detailed stats
  const videoParams = new URLSearchParams({
    part: "snippet,statistics,contentDetails",
    id: videoIds,
    access_token: token,
  });
  const videoRes = await fetch(`${YT_API_BASE}/videos?${videoParams}`);
  if (!videoRes.ok) throw new Error(`YT videos fetch failed: ${videoRes.status}`);
  return videoRes.json();
}

// Get video analytics
export async function getYouTubeVideoAnalytics(
  token: string,
  videoId: string,
  startDate: string,
  endDate: string
) {
  const params = new URLSearchParams({
    ids: "channel==MINE",
    startDate,
    endDate,
    metrics: "views,estimatedMinutesWatched,averageViewDuration,likes,comments,shares,subscribersGained",
    dimensions: "day",
    filters: `video==${videoId}`,
    sort: "day",
    access_token: token,
  });
  const res = await fetch(`${YT_ANALYTICS_BASE}/reports?${params}`);
  if (!res.ok) throw new Error(`YT analytics failed: ${res.status}`);
  return res.json();
}

// Get channel analytics overview
export async function getYouTubeChannelAnalytics(
  token: string,
  startDate: string,
  endDate: string
) {
  const params = new URLSearchParams({
    ids: "channel==MINE",
    startDate,
    endDate,
    metrics: "views,estimatedMinutesWatched,averageViewDuration,likes,comments,shares,subscribersGained,subscribersLost",
    dimensions: "day",
    sort: "day",
    access_token: token,
  });
  const res = await fetch(`${YT_ANALYTICS_BASE}/reports?${params}`);
  if (!res.ok) throw new Error(`YT channel analytics failed: ${res.status}`);
  return res.json();
}

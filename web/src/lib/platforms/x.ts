/**
 * X (Twitter) API v2 integration - OPTIONAL MODULE
 *
 * This module requires the client to provide their own API credentials.
 * Client must subscribe to X Developer Portal Basic ($200/mo+) or higher.
 *
 * API keys are stored in the platform_accounts.metadata field,
 * NOT in environment variables (since each client has their own keys).
 */

const X_API_BASE = "https://api.twitter.com/2";

interface XCredentials {
  apiKey: string;
  apiSecret: string;
  accessToken: string;
  accessTokenSecret: string;
}

// Generate OAuth 2.0 PKCE authorization URL
export function getXAuthUrl(
  redirectUri: string,
  clientId: string,
  codeChallenge: string
) {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: "tweet.read tweet.write users.read offline.access",
    state: "social_harness",
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });
  return `https://twitter.com/i/oauth2/authorize?${params}`;
}

// Get authenticated user profile
export async function getXProfile(bearerToken: string) {
  const res = await fetch(
    `${X_API_BASE}/users/me?user.fields=id,name,username,profile_image_url,public_metrics`,
    { headers: { Authorization: `Bearer ${bearerToken}` } }
  );
  if (!res.ok) throw new Error(`X profile fetch failed: ${res.status}`);
  return res.json();
}

// Get user's recent tweets
export async function getXTweets(
  bearerToken: string,
  userId: string,
  maxResults = 10
) {
  const params = new URLSearchParams({
    "tweet.fields":
      "id,text,created_at,public_metrics,referenced_tweets,attachments",
    max_results: String(maxResults),
    exclude: "retweets,replies",
  });
  const res = await fetch(
    `${X_API_BASE}/users/${userId}/tweets?${params}`,
    { headers: { Authorization: `Bearer ${bearerToken}` } }
  );
  if (!res.ok) throw new Error(`X tweets fetch failed: ${res.status}`);
  return res.json();
}

// Post a tweet
export async function postTweet(bearerToken: string, text: string) {
  const res = await fetch(`${X_API_BASE}/tweets`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${bearerToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error(`X post failed: ${res.status}`);
  return res.json();
}

// Get tweet metrics (requires Basic $200/mo tier)
export async function getTweetMetrics(
  bearerToken: string,
  tweetIds: string[]
) {
  const params = new URLSearchParams({
    ids: tweetIds.join(","),
    "tweet.fields": "public_metrics,non_public_metrics,organic_metrics",
  });
  const res = await fetch(`${X_API_BASE}/tweets?${params}`, {
    headers: { Authorization: `Bearer ${bearerToken}` },
  });
  if (!res.ok) throw new Error(`X metrics fetch failed: ${res.status}`);
  return res.json();
}

// Check if X credentials are configured for a tenant
export function isXConfigured(metadata: Record<string, unknown>): boolean {
  return !!(
    metadata?.x_api_key &&
    metadata?.x_api_secret &&
    metadata?.x_access_token
  );
}

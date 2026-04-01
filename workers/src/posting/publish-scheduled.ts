import type { SupabaseClient } from "@supabase/supabase-js";
import { wait } from "../lib/platforms";

type Platform = "instagram" | "youtube" | "threads" | "tiktok" | "x";

interface ScheduledPost {
  id: string;
  tenant_id: string;
  caption: string | null;
  media_urls: string[];
  post_type: string;
  hashtags: string[];
  scheduled_at: string;
  status: string;
  target_platforms: Array<{
    platform_account_id: string;
    platform: Platform;
  }>;
}

interface PlatformAccount {
  id: string;
  platform: Platform;
  platform_user_id: string;
  access_token: string;
  metadata: Record<string, unknown>;
}

interface PublishResult {
  platform: Platform;
  platform_account_id: string;
  success: boolean;
  platform_post_id?: string;
  error?: string;
}

/**
 * Publish scheduled posts that are due.
 * Called by cron trigger (every minute or as configured).
 */
export async function publishScheduledPosts(supabase: SupabaseClient) {
  const now = new Date().toISOString();

  // Fetch posts due for publishing
  const { data: posts, error } = await supabase
    .from("scheduled_posts")
    .select("*")
    .eq("status", "scheduled")
    .lte("scheduled_at", now)
    .order("scheduled_at", { ascending: true })
    .limit(10);

  if (error) {
    console.error("Failed to fetch scheduled posts:", error.message);
    return;
  }

  for (const post of (posts || []) as ScheduledPost[]) {
    await processPost(supabase, post);
    await wait(500);
  }
}

async function processPost(supabase: SupabaseClient, post: ScheduledPost) {
  // Mark as publishing
  await supabase
    .from("scheduled_posts")
    .update({ status: "publishing" })
    .eq("id", post.id);

  const results: PublishResult[] = [];

  for (const target of post.target_platforms) {
    // Fetch the platform account
    const { data: account } = await supabase
      .from("platform_accounts")
      .select("id, platform, platform_user_id, access_token, metadata")
      .eq("id", target.platform_account_id)
      .eq("is_active", true)
      .single();

    if (!account) {
      results.push({
        platform: target.platform,
        platform_account_id: target.platform_account_id,
        success: false,
        error: "Account not found or inactive",
      });
      continue;
    }

    try {
      const platformPostId = await publishToplatform(
        account as PlatformAccount,
        post
      );
      results.push({
        platform: target.platform,
        platform_account_id: target.platform_account_id,
        success: true,
        platform_post_id: platformPostId,
      });

      // Insert into posts table for insights collection
      if (platformPostId) {
        await supabase.from("posts").upsert(
          {
            tenant_id: post.tenant_id,
            platform_account_id: account.id,
            platform: target.platform,
            platform_post_id: platformPostId,
            post_type: post.post_type,
            caption: post.caption,
            published_at: new Date().toISOString(),
          },
          { onConflict: "platform,platform_post_id" }
        );
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unknown error";
      results.push({
        platform: target.platform,
        platform_account_id: target.platform_account_id,
        success: false,
        error: message,
      });
      console.error(
        `[${target.platform}] Publish failed for post ${post.id}:`,
        message
      );
    }

    await wait(1000);
  }

  // Determine final status: all success → published, all fail → failed, mixed → published (partial)
  const successes = results.filter((r) => r.success);
  const failures = results.filter((r) => !r.success);

  const publishedPostIds: Record<string, string> = {};
  for (const r of successes) {
    if (r.platform_post_id) {
      publishedPostIds[r.platform] = r.platform_post_id;
    }
  }

  const finalStatus =
    successes.length === 0
      ? "failed"
      : "published";

  const errorMessages = failures
    .map((r) => `${r.platform}: ${r.error}`)
    .join("; ");

  await supabase
    .from("scheduled_posts")
    .update({
      status: finalStatus,
      published_post_ids: publishedPostIds,
      error_message: errorMessages || null,
    })
    .eq("id", post.id);

  console.log(
    `Post ${post.id}: ${successes.length}/${results.length} platforms succeeded`
  );
}

/**
 * Publish content to a specific platform.
 * Returns the platform-specific post ID on success.
 */
async function publishToplatform(
  account: PlatformAccount,
  post: ScheduledPost
): Promise<string | undefined> {
  const caption = buildCaption(post);

  switch (account.platform) {
    case "instagram":
      return publishInstagram(account, caption, post.media_urls);
    case "threads":
      return publishThreads(account, caption, post.media_urls);
    case "youtube":
      // YouTube requires video upload — placeholder for now
      console.log(
        `[youtube] Video publishing requires upload flow — skipping for post ${post.id}`
      );
      return undefined;
    case "tiktok":
      // TikTok requires video upload flow
      console.log(
        `[tiktok] Video publishing requires upload flow — skipping for post ${post.id}`
      );
      return undefined;
    case "x":
      return publishX(account, caption);
  }
}

function buildCaption(post: ScheduledPost): string {
  let text = post.caption || "";
  if (post.hashtags.length > 0) {
    text += "\n\n" + post.hashtags.join(" ");
  }
  return text;
}

// ---- Platform publish functions ----

const GRAPH_API_BASE = "https://graph.facebook.com/v22.0";
const THREADS_API_BASE = "https://graph.threads.net/v1.0";
const X_API_BASE = "https://api.twitter.com/2";

async function publishInstagram(
  account: PlatformAccount,
  caption: string,
  mediaUrls: string[]
): Promise<string | undefined> {
  const igAccountId =
    (account.metadata.ig_business_account_id as string) ||
    account.platform_user_id;

  if (!mediaUrls.length) {
    throw new Error("Instagram requires at least one image");
  }

  // Create container
  const containerRes = await fetch(
    `${GRAPH_API_BASE}/${igAccountId}/media`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        image_url: mediaUrls[0],
        caption,
        access_token: account.access_token,
      }),
    }
  );
  if (!containerRes.ok)
    throw new Error(`IG container failed: ${containerRes.status}`);
  const { id: containerId } = (await containerRes.json()) as { id: string };

  // Publish
  const publishRes = await fetch(
    `${GRAPH_API_BASE}/${igAccountId}/media_publish`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        creation_id: containerId,
        access_token: account.access_token,
      }),
    }
  );
  if (!publishRes.ok)
    throw new Error(`IG publish failed: ${publishRes.status}`);
  const { id: postId } = (await publishRes.json()) as { id: string };
  return postId;
}

async function publishThreads(
  account: PlatformAccount,
  caption: string,
  mediaUrls: string[]
): Promise<string | undefined> {
  const params: Record<string, string> = {
    text: caption,
    media_type: "TEXT",
    access_token: account.access_token,
  };
  if (mediaUrls.length > 0) {
    params.image_url = mediaUrls[0];
    params.media_type = "IMAGE";
  }

  const containerRes = await fetch(
    `${THREADS_API_BASE}/${account.platform_user_id}/threads`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(params),
    }
  );
  if (!containerRes.ok)
    throw new Error(`Threads container failed: ${containerRes.status}`);
  const { id: containerId } = (await containerRes.json()) as { id: string };

  const publishRes = await fetch(
    `${THREADS_API_BASE}/${account.platform_user_id}/threads_publish`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        creation_id: containerId,
        access_token: account.access_token,
      }),
    }
  );
  if (!publishRes.ok)
    throw new Error(`Threads publish failed: ${publishRes.status}`);
  const { id: postId } = (await publishRes.json()) as { id: string };
  return postId;
}

async function publishX(
  account: PlatformAccount,
  caption: string
): Promise<string | undefined> {
  const res = await fetch(`${X_API_BASE}/tweets`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${account.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text: caption }),
  });
  if (!res.ok) throw new Error(`X post failed: ${res.status}`);
  const data = (await res.json()) as { data: { id: string } };
  return data.data.id;
}

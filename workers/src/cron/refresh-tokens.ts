import type { SupabaseClient } from "@supabase/supabase-js";
import {
  refreshInstagramToken,
  refreshThreadsToken,
  refreshYouTubeToken,
  wait,
} from "../lib/platforms";

type Platform = "instagram" | "youtube" | "threads" | "x";

interface PlatformAccount {
  id: string;
  tenant_id: string;
  platform: Platform;
  platform_user_id: string;
  access_token: string;
  refresh_token: string | null;
  metadata: Record<string, unknown>;
}

interface Env {
  META_APP_ID: string;
  META_APP_SECRET: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
}

/**
 * Refresh tokens expiring within 7 days.
 * Runs weekly (Monday 06:00) via Cron Trigger.
 * 3 consecutive failures → is_active = false.
 */
export async function refreshTokens(supabase: SupabaseClient, env: Env) {
  const sevenDaysFromNow = new Date(
    Date.now() + 7 * 24 * 60 * 60 * 1000
  ).toISOString();

  const { data: accounts, error } = await supabase
    .from("platform_accounts")
    .select(
      "id, tenant_id, platform, platform_user_id, access_token, refresh_token, metadata"
    )
    .eq("is_active", true)
    .lt("token_expires_at", sevenDaysFromNow);

  if (error) {
    console.error("Failed to fetch expiring accounts:", error.message);
    return;
  }

  for (const account of (accounts || []) as PlatformAccount[]) {
    try {
      await refreshAccountToken(supabase, account, env);
      // Reset failure count on success
      await supabase
        .from("platform_accounts")
        .update({
          metadata: { ...account.metadata, refresh_failures: 0 },
        })
        .eq("id", account.id);

      console.log(
        `[${account.platform}] ${account.platform_user_id} token refreshed`
      );
    } catch (err) {
      const failures =
        ((account.metadata.refresh_failures as number) || 0) + 1;

      if (failures >= 3) {
        // Deactivate after 3 consecutive failures
        await supabase
          .from("platform_accounts")
          .update({
            is_active: false,
            metadata: {
              ...account.metadata,
              refresh_failures: failures,
              deactivated_reason: "token_refresh_failed_3x",
              deactivated_at: new Date().toISOString(),
            },
          })
          .eq("id", account.id);

        console.error(
          `[${account.platform}] ${account.platform_user_id} deactivated after ${failures} failures`
        );
      } else {
        await supabase
          .from("platform_accounts")
          .update({
            metadata: { ...account.metadata, refresh_failures: failures },
          })
          .eq("id", account.id);

        console.error(
          `[${account.platform}] ${account.platform_user_id} refresh failed (${failures}/3):`,
          err
        );
      }
    }
    await wait(1000);
  }
}

async function refreshAccountToken(
  supabase: SupabaseClient,
  account: PlatformAccount,
  env: Env
) {
  switch (account.platform) {
    case "instagram": {
      const result = await refreshInstagramToken(
        account.access_token,
        env.META_APP_ID,
        env.META_APP_SECRET
      );
      const expiresAt = new Date(
        Date.now() + result.expires_in * 1000
      ).toISOString();
      await supabase
        .from("platform_accounts")
        .update({
          access_token: result.access_token,
          token_expires_at: expiresAt,
        })
        .eq("id", account.id);
      break;
    }

    case "threads": {
      const result = await refreshThreadsToken(account.access_token);
      const expiresAt = new Date(
        Date.now() + result.expires_in * 1000
      ).toISOString();
      await supabase
        .from("platform_accounts")
        .update({
          access_token: result.access_token,
          token_expires_at: expiresAt,
        })
        .eq("id", account.id);
      break;
    }

    case "youtube": {
      // YouTube uses refresh_token (stored in refresh_token column or metadata)
      const refreshToken =
        account.refresh_token ||
        (account.metadata.refresh_token as string);
      if (!refreshToken) {
        throw new Error("No refresh_token available for YouTube account");
      }
      const result = await refreshYouTubeToken(
        refreshToken,
        env.GOOGLE_CLIENT_ID,
        env.GOOGLE_CLIENT_SECRET
      );
      const expiresAt = new Date(
        Date.now() + result.expires_in * 1000
      ).toISOString();
      await supabase
        .from("platform_accounts")
        .update({
          access_token: result.access_token,
          token_expires_at: expiresAt,
        })
        .eq("id", account.id);
      break;
    }

    case "x":
      // X tokens are managed by the client
      console.log(
        `[x] ${account.platform_user_id} skipped (client-managed)`
      );
      break;
  }
}

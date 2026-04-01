import { NextRequest, NextResponse } from "next/server";
import {
  exchangeTikTokCode,
  getTikTokUser,
} from "@/lib/platforms/tiktok";
import { createServiceClient } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const error = request.nextUrl.searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(
      new URL("/dashboard?error=tiktok_auth_denied", request.url)
    );
  }

  try {
    const clientKey = process.env.TIKTOK_CLIENT_KEY!;
    const clientSecret = process.env.TIKTOK_CLIENT_SECRET!;
    const redirectUri = `${request.nextUrl.origin}/api/auth/tiktok/callback`;

    // 1. Exchange code for tokens
    const {
      access_token,
      refresh_token,
      expires_in,
      open_id,
    } = await exchangeTikTokCode(code, redirectUri, clientKey, clientSecret);

    // 2. Get user profile
    const user = await getTikTokUser(access_token);

    // 3. Upsert platform account in Supabase
    const supabase = createServiceClient();
    const expiresAt = new Date(
      Date.now() + expires_in * 1000
    ).toISOString();

    // TODO: Get tenant_id from session/auth context
    const tenantId = request.nextUrl.searchParams.get("state") || "";

    await supabase.from("platform_accounts").upsert(
      {
        tenant_id: tenantId,
        platform: "tiktok",
        platform_user_id: open_id,
        platform_username: user.display_name,
        display_name: user.display_name,
        access_token: access_token,
        refresh_token: refresh_token,
        token_expires_at: expiresAt,
        is_active: true,
        metadata: {
          open_id,
          avatar_url: user.avatar_url,
          follower_count: user.follower_count,
          following_count: user.following_count,
          likes_count: user.likes_count,
          video_count: user.video_count,
        },
      },
      { onConflict: "tenant_id,platform,platform_user_id" }
    );

    return NextResponse.redirect(
      new URL("/dashboard?connected=tiktok", request.url)
    );
  } catch (err) {
    console.error("TikTok OAuth error:", err);
    return NextResponse.redirect(
      new URL("/dashboard?error=tiktok_auth_failed", request.url)
    );
  }
}

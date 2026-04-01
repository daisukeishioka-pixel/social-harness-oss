import { NextRequest, NextResponse } from "next/server";
import {
  exchangeYouTubeCode,
  getYouTubeChannel,
} from "@/lib/platforms/youtube";
import { createServiceClient } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const error = request.nextUrl.searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(
      new URL("/dashboard?error=youtube_auth_denied", request.url)
    );
  }

  try {
    const clientId = process.env.GOOGLE_CLIENT_ID!;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;
    const redirectUri = `${request.nextUrl.origin}/api/auth/youtube/callback`;

    // 1. Exchange code for tokens
    const { access_token, refresh_token, expires_in } =
      await exchangeYouTubeCode(code, redirectUri, clientId, clientSecret);

    // 2. Get channel info
    const channelData = await getYouTubeChannel(access_token);
    const channel = channelData.items?.[0];

    if (!channel) {
      return NextResponse.redirect(
        new URL("/dashboard?error=no_youtube_channel", request.url)
      );
    }

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
        platform: "youtube",
        platform_user_id: channel.id,
        platform_username: channel.snippet.customUrl,
        display_name: channel.snippet.title,
        access_token: access_token,
        refresh_token: refresh_token,
        token_expires_at: expiresAt,
        is_active: true,
        metadata: {
          channel_id: channel.id,
          profile_picture_url: channel.snippet.thumbnails?.default?.url,
          subscriber_count: channel.statistics.subscriberCount,
          video_count: channel.statistics.videoCount,
          view_count: channel.statistics.viewCount,
        },
      },
      { onConflict: "tenant_id,platform,platform_user_id" }
    );

    return NextResponse.redirect(
      new URL("/dashboard?connected=youtube", request.url)
    );
  } catch (err) {
    console.error("YouTube OAuth error:", err);
    return NextResponse.redirect(
      new URL("/dashboard?error=youtube_auth_failed", request.url)
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import {
  exchangeThreadsCode,
  getLongLivedThreadsToken,
  getThreadsProfile,
} from "@/lib/platforms/threads";
import { createServiceClient } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const error = request.nextUrl.searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(
      new URL("/dashboard?error=threads_auth_denied", request.url)
    );
  }

  try {
    const appId = process.env.META_APP_ID!;
    const appSecret = process.env.META_APP_SECRET!;
    const redirectUri = `${request.nextUrl.origin}/api/auth/threads/callback`;

    // 1. Exchange code for short-lived token
    const { access_token: shortToken, user_id } =
      await exchangeThreadsCode(code, redirectUri, appId, appSecret);

    // 2. Exchange for long-lived token
    const { access_token: longToken, expires_in } =
      await getLongLivedThreadsToken(shortToken, appSecret);

    // 3. Get user profile
    const profile = await getThreadsProfile(longToken, user_id);

    // 4. Upsert platform account in Supabase
    const supabase = createServiceClient();
    const expiresAt = new Date(
      Date.now() + expires_in * 1000
    ).toISOString();

    // TODO: Get tenant_id from session/auth context
    // For now, use a placeholder approach
    const tenantId = request.nextUrl.searchParams.get("state") || "";

    await supabase.from("platform_accounts").upsert(
      {
        tenant_id: tenantId,
        platform: "threads",
        platform_user_id: user_id,
        platform_username: profile.username,
        display_name: profile.name,
        access_token: longToken,
        token_expires_at: expiresAt,
        is_active: true,
        metadata: {
          profile_picture_url: profile.threads_profile_picture_url,
          biography: profile.threads_biography,
        },
      },
      { onConflict: "tenant_id,platform,platform_user_id" }
    );

    return NextResponse.redirect(
      new URL("/dashboard?connected=threads", request.url)
    );
  } catch (err) {
    console.error("Threads OAuth error:", err);
    return NextResponse.redirect(
      new URL("/dashboard?error=threads_auth_failed", request.url)
    );
  }
}

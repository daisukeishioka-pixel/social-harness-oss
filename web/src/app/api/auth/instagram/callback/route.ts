import { NextRequest, NextResponse } from "next/server";
import {
  exchangeInstagramCode,
  getLongLivedInstagramToken,
  getFacebookPages,
  getInstagramAccount,
} from "@/lib/platforms/instagram";
import { createServiceClient } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const error = request.nextUrl.searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(
      new URL("/dashboard?error=instagram_auth_denied", request.url)
    );
  }

  try {
    const appId = process.env.META_APP_ID!;
    const appSecret = process.env.META_APP_SECRET!;
    const redirectUri = `${request.nextUrl.origin}/api/auth/instagram/callback`;

    // 1. Exchange code for short-lived token
    const { access_token: shortToken } = await exchangeInstagramCode(
      code, redirectUri, appId, appSecret
    );

    // 2. Exchange for long-lived token
    const { access_token: longToken, expires_in } =
      await getLongLivedInstagramToken(shortToken, appId, appSecret);

    // 3. Get Facebook Pages with Instagram accounts
    const pagesData = await getFacebookPages(longToken);
    const pages = pagesData.data || [];

    // Find first page with Instagram business account
    let igAccount = null;
    let pageToken = "";
    for (const page of pages) {
      if (page.instagram_business_account) {
        const accountData = await getInstagramAccount(
          page.id,
          page.access_token
        );
        igAccount =
          accountData.instagram_business_account;
        pageToken = page.access_token;
        break;
      }
    }

    if (!igAccount) {
      return NextResponse.redirect(
        new URL(
          "/dashboard?error=no_instagram_business_account",
          request.url
        )
      );
    }

    // 4. Upsert platform account
    const supabase = createServiceClient();
    const expiresAt = new Date(
      Date.now() + expires_in * 1000
    ).toISOString();

    const tenantId = request.nextUrl.searchParams.get("state") || "";

    await supabase.from("platform_accounts").upsert(
      {
        tenant_id: tenantId,
        platform: "instagram",
        platform_user_id: igAccount.id,
        platform_username: igAccount.username,
        display_name: igAccount.name,
        access_token: pageToken, // Use page token for IG API calls
        token_expires_at: expiresAt,
        is_active: true,
        metadata: {
          ig_business_account_id: igAccount.id,
          profile_picture_url: igAccount.profile_picture_url,
          followers_count: igAccount.followers_count,
          media_count: igAccount.media_count,
        },
      },
      { onConflict: "tenant_id,platform,platform_user_id" }
    );

    return NextResponse.redirect(
      new URL("/dashboard?connected=instagram", request.url)
    );
  } catch (err) {
    console.error("Instagram OAuth error:", err);
    return NextResponse.redirect(
      new URL("/dashboard?error=instagram_auth_failed", request.url)
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const tenantId = request.nextUrl.searchParams.get("tenant_id");
  const platform = request.nextUrl.searchParams.get("platform");
  const days = Number(request.nextUrl.searchParams.get("days") || "30");

  if (!tenantId) {
    return NextResponse.json(
      { error: "tenant_id is required" },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();
  const since = new Date(
    Date.now() - days * 24 * 60 * 60 * 1000
  ).toISOString();

  // Fetch post performance (from view)
  let postQuery = supabase
    .from("v_post_performance")
    .select("*")
    .eq("tenant_id", tenantId)
    .gte("published_at", since)
    .order("published_at", { ascending: false })
    .limit(50);

  if (platform) {
    postQuery = postQuery.eq("platform", platform);
  }

  // Fetch account metrics
  let metricsQuery = supabase
    .from("account_metrics")
    .select(
      "id, platform_account_id, platform, metric_date, followers, following, total_reach, total_impressions, profile_views"
    )
    .eq("tenant_id", tenantId)
    .gte("metric_date", since.split("T")[0])
    .order("metric_date", { ascending: true });

  if (platform) {
    metricsQuery = metricsQuery.eq("platform", platform);
  }

  // Fetch connected accounts
  let accountsQuery = supabase
    .from("platform_accounts")
    .select("id, platform, platform_username, display_name, is_active")
    .eq("tenant_id", tenantId)
    .eq("is_active", true);

  if (platform) {
    accountsQuery = accountsQuery.eq("platform", platform);
  }

  const [postsResult, metricsResult, accountsResult] = await Promise.all([
    postQuery,
    metricsQuery,
    accountsQuery,
  ]);

  if (postsResult.error || metricsResult.error || accountsResult.error) {
    return NextResponse.json(
      {
        error: "Failed to fetch data",
        details: {
          posts: postsResult.error?.message,
          metrics: metricsResult.error?.message,
          accounts: accountsResult.error?.message,
        },
      },
      { status: 500 }
    );
  }

  // Aggregate summary
  const latestMetrics = metricsResult.data || [];
  const latestByAccount = new Map<
    string,
    (typeof latestMetrics)[number]
  >();
  for (const m of latestMetrics) {
    latestByAccount.set(m.platform_account_id, m);
  }

  const totalFollowers = Array.from(latestByAccount.values()).reduce(
    (sum, m) => sum + (m.followers ?? 0),
    0
  );
  const totalReach = Array.from(latestByAccount.values()).reduce(
    (sum, m) => sum + (m.total_reach ?? 0),
    0
  );

  const posts = postsResult.data || [];
  const avgEngagement =
    posts.length > 0
      ? posts.reduce(
          (sum, p) =>
            sum + (p.engagement_rate ? Number(p.engagement_rate) : 0),
          0
        ) / posts.filter((p) => p.engagement_rate != null).length || 0
      : 0;

  return NextResponse.json({
    summary: {
      total_followers: totalFollowers,
      total_reach: totalReach,
      avg_engagement_rate: Number(avgEngagement.toFixed(4)),
      post_count: posts.length,
    },
    posts,
    metrics: metricsResult.data,
    accounts: accountsResult.data,
  });
}

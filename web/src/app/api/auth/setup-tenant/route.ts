import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const { userId, tenantName, email } = await request.json();

    if (!userId || !tenantName) {
      return NextResponse.json(
        { error: "userId and tenantName are required" },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // Generate slug from tenant name
    const slug = tenantName
      .toLowerCase()
      .replace(/[^a-z0-9\u3040-\u9faf]+/g, "-")
      .replace(/^-|-$/g, "")
      || `tenant-${Date.now()}`;

    // Create tenant
    const { data: tenant, error: tenantError } = await supabase
      .from("tenants")
      .insert({
        name: tenantName,
        slug: `${slug}-${Date.now().toString(36)}`,
        contact_email: email || null,
      })
      .select("id")
      .single();

    if (tenantError) {
      return NextResponse.json(
        { error: `テナント作成エラー: ${tenantError.message}` },
        { status: 500 }
      );
    }

    // Create user profile linking user to tenant
    const { error: profileError } = await supabase
      .from("user_profiles")
      .insert({
        id: userId,
        tenant_id: tenant.id,
        role: "owner",
        display_name: tenantName,
      });

    if (profileError) {
      return NextResponse.json(
        { error: `プロフィール作成エラー: ${profileError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ tenantId: tenant.id });
  } catch {
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

// GET: List scheduled posts
export async function GET(request: NextRequest) {
  const tenantId = request.nextUrl.searchParams.get("tenant_id");
  const status = request.nextUrl.searchParams.get("status");
  const platform = request.nextUrl.searchParams.get("platform");

  if (!tenantId) {
    return NextResponse.json(
      { error: "tenant_id is required" },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();

  let query = supabase
    .from("scheduled_posts")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("scheduled_at", { ascending: true });

  if (status) {
    query = query.eq("status", status);
  }

  if (platform) {
    query = query.contains("target_platforms", [{ platform }]);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ posts: data });
}

// POST: Create a scheduled post
export async function POST(request: NextRequest) {
  const body = await request.json();

  const {
    tenant_id,
    caption,
    media_urls = [],
    post_type = "text",
    hashtags = [],
    scheduled_at,
    target_platforms,
    status = "scheduled",
  } = body;

  if (!tenant_id || !scheduled_at || !target_platforms?.length) {
    return NextResponse.json(
      { error: "tenant_id, scheduled_at, and target_platforms are required" },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("scheduled_posts")
    .insert({
      tenant_id,
      caption,
      media_urls,
      post_type,
      hashtags,
      scheduled_at,
      target_platforms,
      status,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ post: data }, { status: 201 });
}

// PATCH: Update a scheduled post
export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const { id, ...updates } = body;

  if (!id) {
    return NextResponse.json(
      { error: "id is required" },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("scheduled_posts")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ post: data });
}

// DELETE: Delete a scheduled post
export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { error: "id is required" },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();

  const { error } = await supabase
    .from("scheduled_posts")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ deleted: true });
}

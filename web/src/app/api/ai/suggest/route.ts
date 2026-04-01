import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

interface SuggestionOutput {
  caption: string;
  hashtags: string[];
  platform_hint: string;
  reasoning: string;
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { tenant_id, industry = "", tone = "プロフェッショナル", platform } = body;

  if (!tenant_id) {
    return NextResponse.json(
      { error: "tenant_id is required" },
      { status: 400 }
    );
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY not configured" },
      { status: 500 }
    );
  }

  const supabase = createServiceClient();

  // Fetch recent post performance for context
  let postQuery = supabase
    .from("v_post_performance")
    .select("*")
    .eq("tenant_id", tenant_id)
    .order("published_at", { ascending: false })
    .limit(10);

  if (platform) {
    postQuery = postQuery.eq("platform", platform);
  }

  const { data: recentPosts } = await postQuery;

  // Find top 5 by engagement
  const topPosts = [...(recentPosts || [])]
    .sort(
      (a, b) =>
        (Number(b.engagement_rate) || 0) - (Number(a.engagement_rate) || 0)
    )
    .slice(0, 5);

  // Build prompt
  const postContext =
    recentPosts && recentPosts.length > 0
      ? recentPosts
          .map(
            (p, i) =>
              `${i + 1}. [${p.platform}] "${(p.caption || "").slice(0, 80)}" — ER: ${p.engagement_rate ?? "N/A"}, Likes: ${p.likes ?? 0}, Reach: ${p.reach ?? p.views ?? 0}`
          )
          .join("\n")
      : "まだ投稿データがありません。一般的なベストプラクティスに基づいて提案してください。";

  const topContext =
    topPosts.length > 0
      ? topPosts
          .map(
            (p) =>
              `- [${p.platform}] "${(p.caption || "").slice(0, 60)}" (ER: ${p.engagement_rate})`
          )
          .join("\n")
      : "";

  const systemPrompt = `あなたはSNSマーケティングの専門家です。クライアントの過去の投稿パフォーマンスデータを分析し、効果的な投稿提案を行います。

提案は必ず以下のJSON配列形式で3つ出力してください。それ以外のテキストは含めないでください：
[
  {
    "caption": "投稿のキャプション全文",
    "hashtags": ["#ハッシュタグ1", "#ハッシュタグ2"],
    "platform_hint": "最適なプラットフォーム（instagram/youtube/threads/tiktok）",
    "reasoning": "この提案の根拠（50字以内）"
  }
]`;

  const userPrompt = `## クライアント情報
- 業種: ${industry || "未設定"}
- トーン: ${tone}
${platform ? `- 対象プラットフォーム: ${platform}` : "- 対象: 全プラットフォーム"}

## 直近10投稿のパフォーマンス
${postContext}

${topContext ? `## エンゲージメント率Top5\n${topContext}` : ""}

上記データを踏まえて、エンゲージメントを最大化する投稿を3つ提案してください。`;

  try {
    const res = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6-20250514",
        max_tokens: 2000,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Anthropic API error:", errText);
      return NextResponse.json(
        { error: `AI API error: ${res.status}` },
        { status: 502 }
      );
    }

    const aiResponse = await res.json();
    const textContent = aiResponse.content?.[0]?.text || "[]";

    // Parse JSON from response
    const jsonMatch = textContent.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return NextResponse.json(
        { error: "Failed to parse AI response" },
        { status: 500 }
      );
    }

    const suggestions: SuggestionOutput[] = JSON.parse(jsonMatch[0]);

    // Save to ai_suggestions table
    const insertRows = suggestions.map((s) => ({
      tenant_id,
      suggestion_type: "content_idea",
      platform: s.platform_hint || null,
      content: s.caption,
      context: {
        hashtags: s.hashtags,
        reasoning: s.reasoning,
        industry,
        tone,
        generated_from_posts: (recentPosts || []).length,
      },
      status: "pending",
    }));

    const { data: saved, error: insertError } = await supabase
      .from("ai_suggestions")
      .insert(insertRows)
      .select();

    if (insertError) {
      console.error("Failed to save suggestions:", insertError.message);
    }

    return NextResponse.json({
      suggestions: (saved || insertRows).map((row, i) => ({
        ...row,
        hashtags: suggestions[i]?.hashtags || [],
        reasoning: suggestions[i]?.reasoning || "",
      })),
    });
  } catch (err) {
    console.error("AI suggestion error:", err);
    return NextResponse.json(
      { error: "Failed to generate suggestions" },
      { status: 500 }
    );
  }
}

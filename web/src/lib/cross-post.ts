/**
 * Cross-post content optimization.
 * Adapts a single post's content for each platform's constraints.
 */

export interface CrossPostInput {
  caption: string;
  hashtags: string[];
  mediaUrls: string[];
  mediaType?: "image" | "video";
}

export interface AdaptedContent {
  caption: string;
  mediaUrls: string[];
  valid: boolean;
  warnings: string[];
}

// ============================================================
// Instagram: image required, 2200 chars, hashtags at end
// ============================================================

export function adaptForInstagram(input: CrossPostInput): AdaptedContent {
  const warnings: string[] = [];
  const hasImage = input.mediaUrls.length > 0;

  if (!hasImage) {
    warnings.push("Instagramには画像が必要です");
  }

  const hashtagBlock = input.hashtags.length > 0
    ? "\n\n" + input.hashtags.join(" ")
    : "";

  let caption = input.caption;

  // Instagram supports up to 30 hashtags — trim if needed
  const maxHashtags = 30;
  const trimmedHashtags = input.hashtags.slice(0, maxHashtags);
  const hashtagText = trimmedHashtags.length > 0
    ? "\n\n" + trimmedHashtags.join(" ")
    : "";

  if (input.hashtags.length > maxHashtags) {
    warnings.push(`ハッシュタグが${maxHashtags}個に制限されました`);
  }

  const maxLen = 2200;
  const available = maxLen - hashtagText.length;
  if (caption.length > available) {
    caption = caption.slice(0, available - 1) + "…";
    warnings.push(`キャプションが${maxLen}字に短縮されました`);
  }

  caption += hashtagText;

  return {
    caption,
    mediaUrls: input.mediaUrls,
    valid: hasImage,
    warnings,
  };
}

// ============================================================
// Threads: 500 chars, text/image/video
// ============================================================

export function adaptForThreads(input: CrossPostInput): AdaptedContent {
  const warnings: string[] = [];
  const maxLen = 500;

  let caption = input.caption;
  if (input.hashtags.length > 0) {
    caption += "\n\n" + input.hashtags.join(" ");
  }

  if (caption.length > maxLen) {
    caption = caption.slice(0, maxLen - 1) + "…";
    warnings.push(`キャプションが${maxLen}字に短縮されました`);
  }

  return {
    caption,
    mediaUrls: input.mediaUrls,
    valid: true,
    warnings,
  };
}

// ============================================================
// YouTube: video required, title 100 chars + description 5000 chars
// ============================================================

export interface YouTubeAdaptedContent extends AdaptedContent {
  title: string;
  description: string;
}

export function adaptForYouTube(
  input: CrossPostInput
): YouTubeAdaptedContent {
  const warnings: string[] = [];
  const hasVideo =
    input.mediaUrls.length > 0 && input.mediaType === "video";

  if (!hasVideo) {
    warnings.push("YouTubeには動画が必要です");
  }

  // Split caption: first line = title, rest = description
  const lines = input.caption.split("\n");
  let title = lines[0] || "";
  let description = lines.slice(1).join("\n").trim();

  if (input.hashtags.length > 0) {
    description += "\n\n" + input.hashtags.join(" ");
  }

  // Title: max 100 chars
  if (title.length > 100) {
    title = title.slice(0, 99) + "…";
    warnings.push("タイトルが100字に短縮されました");
  }

  // Description: max 5000 chars
  if (description.length > 5000) {
    description = description.slice(0, 4999) + "…";
    warnings.push("説明文が5,000字に短縮されました");
  }

  return {
    title,
    description,
    caption: title,
    mediaUrls: input.mediaUrls,
    valid: hasVideo,
    warnings,
  };
}

// ============================================================
// TikTok: video required, 2200 chars
// ============================================================

export function adaptForTikTok(input: CrossPostInput): AdaptedContent {
  const warnings: string[] = [];
  const hasVideo =
    input.mediaUrls.length > 0 && input.mediaType === "video";

  if (!hasVideo) {
    warnings.push("TikTokには動画が必要です");
  }

  const maxLen = 2200;
  let caption = input.caption;

  if (input.hashtags.length > 0) {
    caption += " " + input.hashtags.join(" ");
  }

  if (caption.length > maxLen) {
    caption = caption.slice(0, maxLen - 1) + "…";
    warnings.push(`キャプションが${maxLen}字に短縮されました`);
  }

  return {
    caption,
    mediaUrls: input.mediaUrls,
    valid: hasVideo,
    warnings,
  };
}

// ============================================================
// X: 280 chars, URLs count as 23 chars
// ============================================================

export function adaptForX(input: CrossPostInput): AdaptedContent {
  const warnings: string[] = [];
  const maxLen = 280;
  const urlCharCount = 23;

  let caption = input.caption;

  if (input.hashtags.length > 0) {
    caption += " " + input.hashtags.join(" ");
  }

  // Count URLs as 23 chars each (Twitter t.co wrapping)
  const urlRegex = /https?:\/\/\S+/g;
  const urls = caption.match(urlRegex) || [];
  let effectiveLength = caption.length;
  for (const url of urls) {
    effectiveLength -= url.length;
    effectiveLength += urlCharCount;
  }

  if (effectiveLength > maxLen) {
    // Trim the text portion, preserving URLs
    const overBy = effectiveLength - maxLen;
    const textWithoutUrls = caption.replace(urlRegex, "");
    const trimmedText =
      textWithoutUrls.slice(0, textWithoutUrls.length - overBy - 1) + "…";

    // Reconstruct with URLs
    let idx = 0;
    caption = caption.replace(/https?:\/\/\S+|[^h]+|h/g, (match) => {
      if (match.match(urlRegex)) return match;
      const portion = trimmedText.slice(idx, idx + match.length);
      idx += match.length;
      return portion;
    });

    // Simpler fallback: just trim
    if (caption.length > maxLen) {
      caption = caption.slice(0, maxLen - 1) + "…";
    }

    warnings.push(`テキストが${maxLen}字に短縮されました（URL=23字換算）`);
  }

  return {
    caption,
    mediaUrls: input.mediaUrls.slice(0, 4), // X allows up to 4 images
    valid: true,
    warnings,
  };
}

// ============================================================
// Batch adapt for all selected platforms
// ============================================================

export type PlatformKey =
  | "instagram"
  | "youtube"
  | "threads"
  | "tiktok"
  | "x";

export function adaptForPlatforms(
  input: CrossPostInput,
  platforms: PlatformKey[]
): Record<PlatformKey, AdaptedContent | YouTubeAdaptedContent> {
  const result = {} as Record<
    PlatformKey,
    AdaptedContent | YouTubeAdaptedContent
  >;

  for (const p of platforms) {
    switch (p) {
      case "instagram":
        result.instagram = adaptForInstagram(input);
        break;
      case "threads":
        result.threads = adaptForThreads(input);
        break;
      case "youtube":
        result.youtube = adaptForYouTube(input);
        break;
      case "tiktok":
        result.tiktok = adaptForTikTok(input);
        break;
      case "x":
        result.x = adaptForX(input);
        break;
    }
  }

  return result;
}

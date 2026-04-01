-- ============================================================
-- Social Harness - Supabase Database Schema
-- Version: 1.0
-- Date: 2026-04-01
-- ============================================================

-- 1. TENANTS (クライアント管理)
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  plan TEXT NOT NULL DEFAULT 'standard' CHECK (plan IN ('standard', 'premium')),
  contact_email TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. PLATFORM ACCOUNTS (SNSアカウント)
CREATE TYPE platform_type AS ENUM ('instagram', 'youtube', 'threads', 'tiktok', 'x');

CREATE TABLE platform_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  platform platform_type NOT NULL,
  platform_user_id TEXT NOT NULL,
  platform_username TEXT,
  display_name TEXT,
  access_token TEXT,               -- encrypted at app layer
  refresh_token TEXT,               -- encrypted at app layer
  token_expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB DEFAULT '{}',     -- platform-specific data (e.g., ig_business_account_id)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, platform, platform_user_id)
);

-- 3. POSTS (投稿データ - 各プラットフォームから取得)
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  platform_account_id UUID NOT NULL REFERENCES platform_accounts(id) ON DELETE CASCADE,
  platform platform_type NOT NULL,
  platform_post_id TEXT NOT NULL,   -- platform-specific post ID
  post_type TEXT,                    -- image, video, reel, carousel, text, etc.
  caption TEXT,
  media_url TEXT,
  permalink TEXT,
  published_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',      -- platform-specific fields
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(platform, platform_post_id)
);

-- 4. INSIGHTS SNAPSHOTS (インサイト時系列データ)
CREATE TABLE insights_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  platform platform_type NOT NULL,
  snapshot_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Universal metrics (nullable - not all platforms provide all)
  impressions BIGINT,
  reach BIGINT,
  views BIGINT,
  likes BIGINT,
  comments BIGINT,
  shares BIGINT,
  saves BIGINT,
  clicks BIGINT,
  engagement_rate NUMERIC(6,4),
  
  -- Platform-specific extras
  extra JSONB DEFAULT '{}',         -- e.g., { "reposts": 5, "quotes": 2 } for Threads
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Immutable wrapper for date_trunc (required for use in index expressions)
CREATE OR REPLACE FUNCTION date_trunc_hour_immutable(ts TIMESTAMPTZ)
RETURNS TIMESTAMPTZ AS $$
  SELECT date_trunc('hour', ts);
$$ LANGUAGE sql IMMUTABLE;

-- Prevent duplicate snapshots within same hour
CREATE UNIQUE INDEX idx_insights_post_hour
  ON insights_snapshots (post_id, date_trunc_hour_immutable(snapshot_at));

-- 5. ACCOUNT METRICS (アカウントレベル指標 - 日次)
CREATE TABLE account_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  platform_account_id UUID NOT NULL REFERENCES platform_accounts(id) ON DELETE CASCADE,
  platform platform_type NOT NULL,
  metric_date DATE NOT NULL,
  
  followers BIGINT,
  following BIGINT,
  total_reach BIGINT,
  total_impressions BIGINT,
  profile_views BIGINT,
  
  extra JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(platform_account_id, metric_date)
);

-- 6. SCHEDULED POSTS (予約投稿キュー)
CREATE TYPE post_status AS ENUM ('draft', 'scheduled', 'publishing', 'published', 'failed');

CREATE TABLE scheduled_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Content
  caption TEXT,
  media_urls TEXT[] DEFAULT '{}',   -- array of storage URLs
  post_type TEXT NOT NULL DEFAULT 'text',
  hashtags TEXT[] DEFAULT '{}',
  
  -- Scheduling
  scheduled_at TIMESTAMPTZ NOT NULL,
  status post_status NOT NULL DEFAULT 'draft',
  
  -- Cross-posting targets
  target_platforms JSONB NOT NULL DEFAULT '[]',
  -- e.g., [{"platform_account_id": "uuid", "platform": "instagram"}, ...]
  
  -- Results
  published_post_ids JSONB DEFAULT '{}',
  -- e.g., {"instagram": "post_id_123", "threads": "post_id_456"}
  error_message TEXT,
  
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. AI SUGGESTIONS (AI提案履歴)
CREATE TABLE ai_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  suggestion_type TEXT NOT NULL,     -- 'content_idea', 'caption', 'hashtag', 'analysis_comment'
  platform platform_type,
  content TEXT NOT NULL,
  context JSONB DEFAULT '{}',        -- input data used for generation
  
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
  
  -- Feedback loop
  resulting_post_id UUID REFERENCES posts(id),
  performance_score NUMERIC(6,4),    -- engagement rate of resulting post (if accepted)
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_platform_accounts_tenant ON platform_accounts(tenant_id);
CREATE INDEX idx_posts_tenant ON posts(tenant_id);
CREATE INDEX idx_posts_platform_account ON posts(platform_account_id);
CREATE INDEX idx_posts_published_at ON posts(published_at DESC);
CREATE INDEX idx_insights_tenant ON insights_snapshots(tenant_id);
CREATE INDEX idx_insights_snapshot_at ON insights_snapshots(snapshot_at DESC);
CREATE INDEX idx_account_metrics_date ON account_metrics(metric_date DESC);
CREATE INDEX idx_scheduled_posts_status ON scheduled_posts(status, scheduled_at);
CREATE INDEX idx_ai_suggestions_tenant ON ai_suggestions(tenant_id);

-- ============================================================
-- ROW LEVEL SECURITY (マルチテナント)
-- ============================================================

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE insights_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_suggestions ENABLE ROW LEVEL SECURITY;

-- Tenant isolation policies (tenant_id is passed via JWT custom claim)
CREATE POLICY "Tenant isolation" ON platform_accounts
  FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id')::UUID);

CREATE POLICY "Tenant isolation" ON posts
  FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id')::UUID);

CREATE POLICY "Tenant isolation" ON insights_snapshots
  FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id')::UUID);

CREATE POLICY "Tenant isolation" ON account_metrics
  FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id')::UUID);

CREATE POLICY "Tenant isolation" ON scheduled_posts
  FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id')::UUID);

CREATE POLICY "Tenant isolation" ON ai_suggestions
  FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id')::UUID);

-- Service role bypass for Cloudflare Workers (uses service_role key)
-- Workers will use supabase.from('posts').insert() with service_role key

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON platform_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON scheduled_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Engagement rate calculator view
CREATE OR REPLACE VIEW v_post_performance AS
SELECT
  p.id AS post_id,
  p.tenant_id,
  p.platform,
  p.caption,
  p.published_at,
  ls.impressions,
  ls.reach,
  ls.views,
  ls.likes,
  ls.comments,
  ls.shares,
  ls.saves,
  ls.clicks,
  ls.engagement_rate,
  ls.snapshot_at AS latest_snapshot
FROM posts p
LEFT JOIN LATERAL (
  SELECT * FROM insights_snapshots s
  WHERE s.post_id = p.id
  ORDER BY s.snapshot_at DESC
  LIMIT 1
) ls ON true;

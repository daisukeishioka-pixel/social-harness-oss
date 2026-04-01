"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PLATFORM_CONFIG, type PlatformType } from "@/lib/types";
import { LineTrackingSettings } from "@/components/dashboard/line-tracking-settings";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

type TabId = "account" | "platforms" | "x-api" | "line";

export default function SettingsPageWrapper() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-gray-400">読み込み中...</div>}>
      <SettingsPage />
    </Suspense>
  );
}

interface ConnectedAccount {
  id: string;
  platform: PlatformType;
  platform_username: string | null;
  display_name: string | null;
  is_active: boolean;
  token_expires_at: string | null;
}

function SettingsPage() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") === "x" ? "x-api" : searchParams.get("tab")) as TabId | null;
  const [activeTab, setActiveTab] = useState<TabId>(initialTab || "account");

  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [tenantName, setTenantName] = useState("");
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [xApiKey, setXApiKey] = useState("");
  const [xApiSecret, setXApiSecret] = useState("");
  const [xAccessToken, setXAccessToken] = useState("");
  const [xAccessSecret, setXAccessSecret] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadData = useCallback(async () => {
    const supabase = getSupabaseBrowser();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setEmail(user.email || "");

    // Load profile
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("display_name, tenant_id, tenants(name)")
      .eq("id", user.id)
      .single();

    if (profile) {
      setDisplayName(profile.display_name || "");
      const tenant = profile.tenants as { name: string } | null;
      setTenantName(tenant?.name || "");
    }

    // Load connected platform accounts
    const { data: platformAccounts } = await supabase
      .from("platform_accounts")
      .select("id, platform, platform_username, display_name, is_active, token_expires_at")
      .order("created_at", { ascending: true });

    if (platformAccounts) {
      setAccounts(platformAccounts);

      // Load X API keys if connected
      const xAccount = platformAccounts.find((a: ConnectedAccount) => a.platform === "x");
      if (xAccount) {
        const { data: fullAccount } = await supabase
          .from("platform_accounts")
          .select("metadata")
          .eq("id", xAccount.id)
          .single();
        if (fullAccount?.metadata) {
          const meta = fullAccount.metadata as Record<string, string>;
          setXApiKey(meta.api_key || "");
          setXApiSecret(meta.api_secret ? "••••••••" : "");
          setXAccessToken(meta.access_token_key ? "••••••••" : "");
          setXAccessSecret(meta.access_token_secret ? "••••••••" : "");
        }
      }
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleSaveAccount = async () => {
    setSaving(true);
    try {
      const supabase = getSupabaseBrowser();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Update display name
      const { error: profileError } = await supabase
        .from("user_profiles")
        .update({ display_name: displayName })
        .eq("id", user.id);

      if (profileError) throw profileError;

      // Update tenant name
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("tenant_id")
        .eq("id", user.id)
        .single();

      if (profile) {
        const { error: tenantError } = await supabase
          .from("tenants")
          .update({ name: tenantName })
          .eq("id", profile.tenant_id);

        if (tenantError) throw tenantError;
      }

      showMessage("success", "設定を保存しました");
    } catch {
      showMessage("error", "保存に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveXApi = async () => {
    setSaving(true);
    try {
      const supabase = getSupabaseBrowser();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("user_profiles")
        .select("tenant_id")
        .eq("id", user.id)
        .single();
      if (!profile) throw new Error("Profile not found");

      // Check if X account already exists
      const existingX = accounts.find((a) => a.platform === "x");

      const metadata: Record<string, string> = {};
      if (xApiKey) metadata.api_key = xApiKey;
      if (xApiSecret && !xApiSecret.includes("•")) metadata.api_secret = xApiSecret;
      if (xAccessToken && !xAccessToken.includes("•")) metadata.access_token_key = xAccessToken;
      if (xAccessSecret && !xAccessSecret.includes("•")) metadata.access_token_secret = xAccessSecret;
      metadata.managed_by_client = "true";

      if (existingX) {
        const { error } = await supabase
          .from("platform_accounts")
          .update({ metadata, is_active: true })
          .eq("id", existingX.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("platform_accounts")
          .insert({
            tenant_id: profile.tenant_id,
            platform: "x",
            platform_user_id: `x_${Date.now()}`,
            platform_username: "設定済み",
            display_name: "X (API)",
            metadata,
            is_active: true,
          });
        if (error) throw error;
      }

      showMessage("success", "X APIキーを保存しました");
      loadData();
    } catch {
      showMessage("error", "保存に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  const handleDisconnect = async (accountId: string) => {
    const supabase = getSupabaseBrowser();
    const { error } = await supabase
      .from("platform_accounts")
      .update({ is_active: false })
      .eq("id", accountId);

    if (error) {
      showMessage("error", "切断に失敗しました");
    } else {
      showMessage("success", "プラットフォームを切断しました");
      loadData();
    }
  };

  const handleConnect = (platform: PlatformType) => {
    const origin = window.location.origin;
    switch (platform) {
      case "instagram":
        window.location.href = `${origin}/api/auth/instagram/connect`;
        break;
      case "threads":
        window.location.href = `${origin}/api/auth/threads/connect`;
        break;
      case "youtube":
        window.location.href = `${origin}/api/auth/youtube/connect`;
        break;
      case "tiktok":
        window.location.href = `${origin}/api/auth/tiktok/connect`;
        break;
      case "x":
        setActiveTab("x-api");
        break;
    }
  };

  const tabs: { id: TabId; label: string }[] = [
    { id: "account", label: "アカウント" },
    { id: "platforms", label: "プラットフォーム接続" },
    { id: "x-api", label: "X APIキー" },
    { id: "line", label: "LINE導線設定" },
  ];

  const tokenExpiryStatus = (expiresAt: string | null) => {
    if (!expiresAt) return null;
    const days = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (days < 0) return { label: "期限切れ", variant: "destructive" as const };
    if (days < 7) return { label: `残り${days}日`, variant: "destructive" as const };
    if (days < 30) return { label: `残り${days}日`, variant: "secondary" as const };
    return { label: `残り${days}日`, variant: "outline" as const };
  };

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-6">設定</h1>

      {/* Message */}
      {message && (
        <div
          className={`mb-4 rounded-lg px-4 py-3 text-sm ${
            message.type === "success"
              ? "bg-green-50 border border-green-200 text-green-700"
              : "bg-red-50 border border-red-200 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-6 -mb-px">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Account Tab */}
      {activeTab === "account" && (
        <div className="max-w-lg space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">アカウント情報</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  メールアドレス
                </label>
                <input
                  type="email"
                  value={email}
                  disabled
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500"
                />
                <p className="mt-1 text-xs text-gray-400">
                  メールアドレスは変更できません
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  表示名
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="表示名を入力"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  組織名
                </label>
                <input
                  type="text"
                  value={tenantName}
                  onChange={(e) => setTenantName(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="組織名を入力"
                />
              </div>

              <button
                onClick={handleSaveAccount}
                disabled={saving}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {saving ? "保存中..." : "保存"}
              </button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base text-red-600">危険な操作</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-3">
                アカウントからログアウトします。再度ログインが必要になります。
              </p>
              <form action="/api/auth/logout" method="POST">
                <button
                  type="submit"
                  className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                >
                  ログアウト
                </button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Platforms Tab */}
      {activeTab === "platforms" && (
        <div className="max-w-2xl space-y-4">
          {(["instagram", "youtube", "threads", "tiktok", "x"] as PlatformType[]).map(
            (platform) => {
              const config = PLATFORM_CONFIG[platform];
              const account = accounts.find(
                (a) => a.platform === platform && a.is_active
              );
              const expiry = account ? tokenExpiryStatus(account.token_expires_at) : null;

              return (
                <Card key={platform}>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                          style={{ backgroundColor: config.color }}
                        >
                          {config.label[0]}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm">{config.label}</p>
                            {platform === "x" && (
                              <Badge variant="outline" className="text-[10px]">
                                オプション
                              </Badge>
                            )}
                          </div>
                          {account ? (
                            <div className="flex items-center gap-2 mt-0.5">
                              <p className="text-xs text-green-600">
                                @{account.platform_username || account.display_name} 接続済み
                              </p>
                              {expiry && (
                                <Badge variant={expiry.variant} className="text-[10px]">
                                  {expiry.label}
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <p className="text-xs text-gray-400 mt-0.5">未接続</p>
                          )}
                        </div>
                      </div>

                      {account ? (
                        <button
                          onClick={() => handleDisconnect(account.id)}
                          className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                        >
                          切断
                        </button>
                      ) : (
                        <button
                          onClick={() => handleConnect(platform)}
                          className="rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          {platform === "x" ? "APIキーを設定" : "接続"}
                        </button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            }
          )}
        </div>
      )}

      {/* X API Tab */}
      {activeTab === "x-api" && (
        <div className="max-w-lg">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">X (Twitter) API設定</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-700">
                <p className="font-medium mb-1">APIキーについて</p>
                <p>
                  X APIの利用にはBasic ($200/月〜)のサブスクリプションが必要です。
                  APIキーはX Developer Portalから取得してください。
                  キーはplatform_accountsのmetadataフィールドに暗号化保存されます。
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  API Key
                </label>
                <input
                  type="text"
                  value={xApiKey}
                  onChange={(e) => setXApiKey(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-mono focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="API Key"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  API Secret
                </label>
                <input
                  type="password"
                  value={xApiSecret}
                  onChange={(e) => setXApiSecret(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-mono focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="API Secret"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Access Token
                </label>
                <input
                  type="password"
                  value={xAccessToken}
                  onChange={(e) => setXAccessToken(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-mono focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Access Token"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Access Token Secret
                </label>
                <input
                  type="password"
                  value={xAccessSecret}
                  onChange={(e) => setXAccessSecret(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-mono focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Access Token Secret"
                />
              </div>

              <button
                onClick={handleSaveXApi}
                disabled={saving || !xApiKey}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {saving ? "保存中..." : "APIキーを保存"}
              </button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* LINE Tab */}
      {activeTab === "line" && (
        <div className="max-w-2xl">
          <LineTrackingSettings />
        </div>
      )}
    </div>
  );
}

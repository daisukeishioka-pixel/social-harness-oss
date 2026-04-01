"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

export default function SignupPage() {
  const router = useRouter();

  const [tenantName, setTenantName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = getSupabaseBrowser();

    // 1. Sign up user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (!authData.user) {
      setError("ユーザー作成に失敗しました");
      setLoading(false);
      return;
    }

    // 2. Create tenant + user_profile via API (uses service role)
    const res = await fetch("/api/auth/setup-tenant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: authData.user.id,
        tenantName,
        email,
      }),
    });

    if (!res.ok) {
      const body = await res.json();
      setError(body.error || "テナント作成に失敗しました");
      setLoading(false);
      return;
    }

    // 3. Refresh session to pick up tenant_id claim
    await supabase.auth.refreshSession();

    router.push("/dashboard");
    router.refresh();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600 text-white font-bold text-lg mb-4">
            H
          </div>
          <h1 className="text-xl font-bold text-gray-900">Social Harness</h1>
          <p className="text-sm text-gray-500 mt-1">
            新規アカウント登録
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSignup} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">新規登録</h2>

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="tenantName" className="block text-sm font-medium text-gray-700 mb-1">
              組織名（会社名・チーム名）
            </label>
            <input
              id="tenantName"
              type="text"
              required
              value={tenantName}
              onChange={(e) => setTenantName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="株式会社〇〇"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              メールアドレス
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              パスワード
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="8文字以上"
              minLength={8}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "登録中..." : "アカウントを作成"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          すでにアカウントをお持ちの方は{" "}
          <Link href="/login" className="text-blue-600 hover:underline font-medium">
            ログイン
          </Link>
        </p>
      </div>
    </div>
  );
}

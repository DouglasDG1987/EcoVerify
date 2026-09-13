"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Leaf, Loader2 } from "lucide-react";
import { useSettings } from "@/lib/settings-context";
import { useAuth } from "@/lib/auth-context";

export default function LoginPage() {
  const { t } = useSettings();
  const { refresh } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error ?? t("auth.errorGeneric"));
        setLoading(false);
        return;
      }
      await refresh();
      router.push("/feed");
    } catch {
      setError(t("auth.errorGeneric"));
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50 via-white to-teal-50 px-4 py-10">
      <div className="w-full max-w-md animate-scale-in rounded-3xl bg-white p-8 shadow-xl">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-teal-500 text-white shadow-md">
            <Leaf className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-extrabold text-stone-900">Eco Verify</h1>
          <p className="mt-1 text-sm text-stone-500">{t("auth.tagline")}</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-stone-700">{t("auth.email")}</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-stone-300 px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-stone-700">{t("auth.password")}</label>
            <input
              type="password"
              required
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="w-full rounded-xl border border-stone-300 px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700 animate-fade-in">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {t("auth.loginButton")}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-stone-500">
          {t("auth.noAccount")}{" "}
          <Link href="/register" className="font-semibold text-brand-600 hover:underline">
            {t("auth.goRegister")}
          </Link>
        </p>

        <div className="mt-6 rounded-xl bg-stone-50 p-3 text-center text-xs text-stone-400">
          Demo: admin@ecoverify.app / admin123 · moderador@ecoverify.app / moderador123 · cidadao@ecoverify.app / cidadao123
        </div>
      </div>
    </div>
  );
}

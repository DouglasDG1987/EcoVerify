"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { registerAction, type ActionState } from "@/lib/actions/auth";
import { t, type Lang } from "@/lib/i18n";

const initialState: ActionState = {};

export function RegisterForm({ lang }: { lang: Lang }) {
  const [state, formAction, pending] = useActionState(registerAction, initialState);
  const [password, setPassword] = useState("");

  const errorMessage =
    state?.error === "email_exists"
      ? t(lang, "register_email_exists")
      : state?.error === "weak_password"
        ? t(lang, "register_password_hint")
        : state?.error
          ? t(lang, "login_error")
          : null;

  return (
    <div className="rounded-3xl bg-white p-8 shadow-[0_20px_50px_rgba(16,24,40,0.08)] card-surface border border-black/5">
      <h1 className="text-2xl font-bold text-slate-900">{t(lang, "register_title")}</h1>
      <p className="mt-1 text-sm text-slate-500">{t(lang, "tagline")}</p>

      <form action={formAction} className="mt-6 space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">{t(lang, "register_name")}</label>
          <input
            type="text"
            name="name"
            required
            placeholder="Ana Souza"
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">{t(lang, "login_email")}</label>
          <input
            type="email"
            name="email"
            required
            placeholder="voce@email.com"
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">{t(lang, "login_password")}</label>
          <input
            type="password"
            name="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
          <p className={`mt-1 text-xs ${password.length > 0 && password.length < 6 ? "text-red-500" : "text-slate-400"}`}>
            {t(lang, "register_password_hint")}
          </p>
        </div>

        {errorMessage && (
          <p className="animate-fade-in rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600">
            {errorMessage}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-emerald-200 transition hover:brightness-105 disabled:opacity-70"
        >
          {pending && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
          {t(lang, "register_submit")}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        {t(lang, "register_has_account")}{" "}
        <Link href="/login" className="font-semibold text-emerald-600 hover:underline">
          {t(lang, "register_login")}
        </Link>
      </p>
    </div>
  );
}

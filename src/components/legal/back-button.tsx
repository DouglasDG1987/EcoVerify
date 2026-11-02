"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { ArrowLeft } from "@/components/ui/icons";

export const BACK_PILL =
  "mb-4 inline-flex items-center gap-1.5 rounded-full border border-black/5 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50";
export const BACK_CTA =
  "inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-5 py-2.5 text-sm font-bold text-white";

/**
 * Goes back to the screen the person came from (e.g. Settings → Transparency → back to Settings).
 * When the page was opened directly (new tab, shared link), there is no history: it goes to `fallback`.
 */
export function BackButton({ fallback, className, children }: { fallback: string; className: string; children: ReactNode }) {
  const router = useRouter();
  const goBack = () => {
    if (window.history.length > 1) router.back();
    else router.push(fallback);
  };
  return (
    <button type="button" onClick={goBack} className={className}>
      <ArrowLeft className="h-4 w-4" />
      {children}
    </button>
  );
}

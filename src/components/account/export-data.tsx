"use client";

import { useState } from "react";
import { t, type Lang } from "@/lib/i18n";
import { saveTextFile, shareFile, type SaveResult } from "@/lib/save-file";
import { CheckCircle, Download, FolderOpen, Share2 } from "@/components/ui/icons";

export type ExportData = { ok: true; json: string } | { ok: false; error: "too_many" | "failed" };

export function exportFileName(date = new Date()): string {
  return `ecoverify-meus-dados-${date.toISOString().slice(0, 10)}.json`;
}

/**
 * "Download my data" (LGPD art. 18). Works in the browser and in the Android app (see lib/save-file.ts).
 * `load` fetches the JSON (API on the web, local store in the offline demo).
 */
export function ExportDataCard({ lang, load }: { lang: Lang; load: () => Promise<ExportData> }) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<SaveResult | { kind: "too_many" } | null>(null);
  const [file, setFile] = useState<{ name: string; json: string } | null>(null);

  const run = async () => {
    if (busy) return;
    setBusy(true);
    setResult(null);
    try {
      const data = await load();
      if (!data.ok) {
        setResult(data.error === "too_many" ? { kind: "too_many" } : { kind: "failed" });
        return;
      }
      const name = exportFileName();
      setFile({ name, json: data.json });
      setResult(await saveTextFile(name, data.json, { shareTitle: t(lang, "export_title") }));
    } catch {
      setResult({ kind: "failed" });
    } finally {
      setBusy(false);
    }
  };

  const share = async () => {
    if (!file || busy) return;
    setBusy(true);
    try {
      const r = await shareFile(file.name, file.json, t(lang, "export_title"));
      if (r.kind !== "cancelled" && r.kind !== "shared") setResult(r);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 p-4" data-testid="export-data">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700" aria-hidden>
          <FolderOpen className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-800">{t(lang, "export_title")}</p>
          <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{t(lang, "export_text")}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={run}
        disabled={busy}
        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-60 sm:w-auto"
        data-testid="export-button"
      >
        <Download className="h-4 w-4" /> {busy ? t(lang, "export_preparing") : t(lang, "export_button")}
      </button>

      {result?.kind === "saved" && (
        <div className="mt-3 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900" data-testid="export-result">
          <p className="flex items-start gap-2 font-semibold">
            <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span className="min-w-0 break-words">{t(lang, "export_saved").replace("{path}", result.path)}</span>
          </p>
          <p className="mt-1 pl-6 text-xs text-emerald-800">{t(lang, "export_saved_hint")}</p>
          <button type="button" onClick={share} disabled={busy} className="mt-2 ml-6 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 underline">
            <Share2 className="h-3.5 w-3.5" /> {t(lang, "export_share")}
          </button>
        </div>
      )}
      {result && result.kind !== "saved" && result.kind !== "cancelled" && (
        <p
          className={`mt-3 rounded-xl px-3 py-2 text-xs font-medium ${
            result.kind === "failed" || result.kind === "too_many" ? "bg-red-50 text-red-700" : result.kind === "copied" ? "bg-amber-50 text-amber-800" : "bg-emerald-50 text-emerald-800"
          }`}
          data-testid="export-result"
        >
          {t(
            lang,
            result.kind === "downloaded"
              ? "export_downloaded"
              : result.kind === "shared"
                ? "export_shared"
                : result.kind === "copied"
                  ? "export_copied"
                  : result.kind === "too_many"
                    ? "export_too_many"
                    : "export_failed",
          )}
        </p>
      )}
    </div>
  );
}

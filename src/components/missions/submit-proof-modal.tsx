"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { createSubmissionAction, type SubmissionActionState } from "@/lib/actions/submissions";
import { categoryEmoji, categoryLabels, t, type Lang } from "@/lib/i18n";

const initialState: SubmissionActionState = {};

const errorKeyMap: Record<string, string> = {
  photo_required: "error_photo_required",
  report_length: "error_report_length",
  daily_limit: "error_daily_limit",
  duplicate_photo: "error_duplicate_photo",
};

export function SubmitProofModal({
  lang,
  mission,
}: {
  lang: Lang;
  mission: {
    id: string;
    title: string;
    category: string;
    pointsReward: number;
    foneReward: string;
  };
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(createSubmissionAction, initialState);
  const [preview, setPreview] = useState<string | null>(null);
  const [report, setReport] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      const timeout = setTimeout(() => {
        setOpen(false);
        setPreview(null);
        setReport("");
        setCoords(null);
        formRef.current?.reset();
      }, 1600);
      return () => clearTimeout(timeout);
    }
  }, [state.success]);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
  }

  function handleLocate() {
    if (!("geolocation" in navigator)) {
      setLocationError(true);
      return;
    }
    setLocating(true);
    setLocationError(false);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => {
        setLocationError(true);
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  const reportTooShort = report.length > 0 && report.length < 50;
  const errorMessage = state.error
    ? t(lang, (errorKeyMap[state.error] as any) ?? "error_generic")
    : null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-4 w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-105"
      >
        {t(lang, "send_proof")}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4 animate-fade-in">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white shadow-2xl animate-scale-in">
            {state.success ? (
              <div className="flex flex-col items-center justify-center gap-4 px-8 py-16 text-center">
                <div className="grid h-20 w-20 place-items-center rounded-full bg-emerald-100 text-5xl text-emerald-600 animate-scale-in">
                  ✅
                </div>
                <p className="text-lg font-bold text-slate-900">{t(lang, "submission_success")}</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{categoryEmoji[mission.category]}</span>
                    <h2 className="text-base font-bold text-slate-900">{mission.title}</h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="grid h-8 w-8 place-items-center rounded-full text-lg text-slate-400 hover:bg-slate-100"
                    aria-label={t(lang, "close")}
                  >
                    ✕
                  </button>
                </div>

                <form ref={formRef} action={formAction} className="space-y-4 px-6 py-5">
                  <input type="hidden" name="missionId" value={mission.id} />
                  <input type="hidden" name="latitude" value={coords?.lat ?? ""} readOnly />
                  <input type="hidden" name="longitude" value={coords?.lng ?? ""} readOnly />

                  <label className="block cursor-pointer rounded-2xl border-2 border-dashed border-slate-300 p-4 text-center transition hover:border-emerald-400 hover:bg-emerald-50/40">
                    {preview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={preview} alt="Pré-visualização" className="mx-auto max-h-56 rounded-xl object-cover" />
                    ) : (
                      <div className="flex flex-col items-center gap-2 py-6 text-slate-500">
                        <span className="text-4xl">📷</span>
                        <span className="text-sm font-medium">{t(lang, "photo_tap")}</span>
                      </div>
                    )}
                    <input
                      type="file"
                      name="photo"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={handleFile}
                      required
                    />
                  </label>

                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <label className="text-sm font-medium text-slate-700">{t(lang, "report_label")}</label>
                      <span className={`text-xs font-medium ${reportTooShort ? "text-red-500" : "text-slate-400"}`}>
                        {report.length}/1000
                      </span>
                    </div>
                    <textarea
                      name="report"
                      required
                      minLength={50}
                      maxLength={1000}
                      rows={4}
                      value={report}
                      onChange={(e) => setReport(e.target.value)}
                      placeholder="Conte como foi a experiência, onde e como você realizou a ação..."
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    />
                    {reportTooShort && (
                      <p className="mt-1 text-xs font-medium text-amber-600">
                        Faltam {50 - report.length} caracteres para o mínimo de 50.
                      </p>
                    )}
                  </div>

                  <div>
                    <button
                      type="button"
                      onClick={handleLocate}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-teal-400 hover:bg-teal-50"
                    >
                      {locating ? (
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-teal-600" />
                      ) : (
                        <span>📍</span>
                      )}
                      {coords ? `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}` : t(lang, "use_current_location")}
                    </button>
                    {locationError && (
                      <p className="mt-1 text-xs font-medium text-red-500">
                        Não foi possível obter sua localização. Você pode continuar sem ela.
                      </p>
                    )}
                  </div>

                  {errorMessage && (
                    <p className="animate-fade-in rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600">
                      {errorMessage}
                    </p>
                  )}

                  <div className="rounded-xl bg-slate-50 px-4 py-2.5 text-xs text-slate-500">
                    {categoryLabels[mission.category]?.[lang]} · ⭐ {mission.pointsReward} {t(lang, "reward_points")} · 🪙{" "}
                    {mission.foneReward} FONE
                  </div>

                  <div className="flex gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => setOpen(false)}
                      className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                    >
                      {t(lang, "cancel")}
                    </button>
                    <button
                      type="submit"
                      disabled={pending}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-70"
                    >
                      {pending && (
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      )}
                      {t(lang, "send")}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

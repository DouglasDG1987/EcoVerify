"use client";

import { useRef, useState } from "react";
import { Camera, CheckCircle2, Loader2, MapPin, X } from "lucide-react";
import type { Mission } from "@/lib/types";
import { useSettings } from "@/lib/settings-context";
import { useToast } from "@/components/Toast";
import { MAX_PHOTO_BYTES, MAX_REPORT_LEN, MIN_REPORT_LEN, MISSION_CATEGORY_EMOJI, cn } from "@/lib/utils";
import { getCurrentCoordinates, type Coordinates } from "@/lib/geo";

export function SubmissionModal({
  mission,
  onClose,
  onSuccess,
}: {
  mission: Mission;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { t } = useSettings();
  const { show } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [relatorio, setRelatorio] = useState("");
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [locating, setLocating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    setError(null);
    if (!f) return;

    if (!["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(f.type)) {
      setError(t("submission.errorPhotoType"));
      return;
    }
    if (f.size > MAX_PHOTO_BYTES) {
      setError(t("submission.errorPhotoSize"));
      return;
    }

    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
  };

  const handleCaptureLocation = async () => {
    setLocating(true);
    setError(null);
    try {
      const c = await getCurrentCoordinates();
      setCoords(c);
    } catch {
      setError("Não foi possível obter sua localização.");
    } finally {
      setLocating(false);
    }
  };

  const handleSubmit = async () => {
    setError(null);

    if (!file) {
      setError(t("submission.errorPhotoRequired"));
      return;
    }
    if (relatorio.trim().length < MIN_REPORT_LEN) {
      setError(t("submission.errorReportShort"));
      return;
    }

    setSubmitting(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const uploadRes = await fetch("/api/upload", { method: "POST", body: form });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok || !uploadData.ok) {
        setError(uploadData.error ?? t("auth.errorGeneric"));
        setSubmitting(false);
        return;
      }

      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          missionId: mission.id,
          fotoUrl: uploadData.url,
          fotoHash: uploadData.fotoHash,
          relatorioTexto: relatorio.trim(),
          lat: coords?.lat ?? null,
          lng: coords?.lng ?? null,
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.ok) {
        if (res.status === 429) {
          setError(t("submission.errorRateLimit"));
        } else if (res.status === 409) {
          setError(t("submission.errorDuplicate"));
        } else {
          setError(data.error ?? t("auth.errorGeneric"));
        }
        setSubmitting(false);
        return;
      }

      setSuccess(true);
      show(t("submission.success"), "success");
      setTimeout(() => {
        onSuccess();
      }, 1200);
    } catch {
      setError(t("auth.errorGeneric"));
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
      <div className="animate-slide-up flex max-h-[92vh] w-full flex-col overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl sm:max-w-lg sm:animate-scale-in sm:rounded-3xl">
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{MISSION_CATEGORY_EMOJI[mission.categoria] ?? "🌱"}</span>
            <div>
              <h2 className="text-lg font-bold text-stone-900">{t("submission.title")}</h2>
              <p className="text-sm text-stone-500">{mission.titulo}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-full p-1.5 text-stone-400 hover:bg-stone-100" aria-label={t("common.close")}>
            <X className="h-5 w-5" />
          </button>
        </div>

        {success ? (
          <div className="flex flex-col items-center gap-3 py-10 text-center animate-scale-in">
            <CheckCircle2 className="h-16 w-16 text-brand-500" />
            <p className="text-base font-semibold text-stone-900">{t("submission.success")}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-stone-700">{t("submission.photo")}</label>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex w-full items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-stone-300 bg-stone-50 py-4 text-stone-500 hover:border-brand-400 hover:text-brand-600"
              >
                {previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={previewUrl} alt="Prévia" className="max-h-56 rounded-xl object-cover" />
                ) : (
                  <span className="flex flex-col items-center gap-2 py-6 text-sm">
                    <Camera className="h-8 w-8" />
                    {t("submission.photoHint")}
                  </span>
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                capture="environment"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-stone-700">{t("submission.report")}</label>
              <textarea
                value={relatorio}
                onChange={(e) => setRelatorio(e.target.value.slice(0, MAX_REPORT_LEN))}
                rows={4}
                placeholder={t("submission.reportHint")}
                className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
              />
              <div className="mt-1 flex justify-between text-xs text-stone-400">
                <span>{t("submission.reportHint")}</span>
                <span className={cn(relatorio.length < MIN_REPORT_LEN && "text-amber-600")}>
                  {relatorio.length}/{MAX_REPORT_LEN}
                </span>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-stone-700">{t("submission.location")}</label>
              <button
                type="button"
                onClick={handleCaptureLocation}
                disabled={locating}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-stone-300 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-60"
              >
                {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
                {coords ? `${t("submission.locationCaptured")}: ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}` : t("submission.captureLocation")}
              </button>
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700 animate-fade-in">
                {error}
              </div>
            )}

            <div className="mt-2 flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 rounded-xl border border-stone-300 py-2.5 text-sm font-semibold text-stone-700 hover:bg-stone-50"
              >
                {t("submission.cancel")}
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {submitting ? t("submission.submitting") : t("submission.submit")}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

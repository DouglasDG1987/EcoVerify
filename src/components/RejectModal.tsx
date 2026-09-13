"use client";

import { useState } from "react";
import { Loader2, X } from "lucide-react";
import { useSettings } from "@/lib/settings-context";

export function RejectModal({
  onClose,
  onConfirm,
}: {
  onClose: () => void;
  onConfirm: (motivo: string) => Promise<void>;
}) {
  const { t } = useSettings();
  const [motivo, setMotivo] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    if (motivo.trim().length < 5) {
      setError(t("moderation.rejectReasonHint"));
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onConfirm(motivo.trim());
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
      <div className="animate-slide-up w-full rounded-t-3xl bg-white p-6 shadow-2xl sm:max-w-md sm:animate-scale-in sm:rounded-3xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-stone-900">{t("moderation.rejectReason")}</h2>
          <button onClick={onClose} className="rounded-full p-1.5 text-stone-400 hover:bg-stone-100" aria-label={t("common.close")}>
            <X className="h-5 w-5" />
          </button>
        </div>
        <textarea
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          rows={4}
          placeholder={t("moderation.rejectReasonHint")}
          className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-100"
        />
        {error && <p className="mt-2 text-sm font-medium text-red-600">{error}</p>}
        <div className="mt-4 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-stone-300 py-2.5 text-sm font-semibold text-stone-700 hover:bg-stone-50"
          >
            {t("common.cancel")}
          </button>
          <button
            onClick={handleConfirm}
            disabled={submitting}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {t("moderation.confirmReject")}
          </button>
        </div>
      </div>
    </div>
  );
}

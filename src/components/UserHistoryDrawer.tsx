"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useSettings } from "@/lib/settings-context";
import { StatusBadge } from "@/components/StatusBadge";
import { Skeleton } from "@/components/Skeleton";
import { formatDate, MISSION_CATEGORY_EMOJI } from "@/lib/utils";
import type { SubmissionStatus } from "@/lib/types";

interface HistoryItem {
  id: string;
  status: SubmissionStatus;
  relatorioTexto: string;
  motivoRejeicao: string | null;
  createdAt: string;
  reviewedAt: string | null;
  missionTitulo: string;
  missionCategoria: string;
}

export function UserHistoryDrawer({ userId, onClose }: { userId: string; onClose: () => void }) {
  const { t } = useSettings();
  const [items, setItems] = useState<HistoryItem[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/submissions/user/${userId}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && data.ok) setItems(data.submissions);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
      <div className="animate-slide-up flex h-full w-full max-w-md flex-col overflow-y-auto bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-stone-900">{t("moderation.history")}</h2>
          <button onClick={onClose} className="rounded-full p-1.5 text-stone-400 hover:bg-stone-100" aria-label={t("common.close")}>
            <X className="h-5 w-5" />
          </button>
        </div>

        {items === null && (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        )}

        {items?.length === 0 && <p className="text-sm text-stone-500">{t("mySubmissions.empty")}</p>}

        <div className="flex flex-col gap-3">
          {items?.map((item) => (
            <div key={item.id} className="card-surface rounded-2xl p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-sm font-semibold text-stone-800">
                  {MISSION_CATEGORY_EMOJI[item.missionCategoria] ?? "🌱"} {item.missionTitulo}
                </span>
                <StatusBadge status={item.status} />
              </div>
              <p className="mb-1 text-xs text-stone-400">{formatDate(item.createdAt)}</p>
              <p className="line-clamp-2 text-sm text-stone-600">{item.relatorioTexto}</p>
              {item.motivoRejeicao && (
                <p className="mt-2 rounded-lg bg-red-50 px-2 py-1 text-xs text-red-700">
                  {t("mySubmissions.reason")}: {item.motivoRejeicao}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

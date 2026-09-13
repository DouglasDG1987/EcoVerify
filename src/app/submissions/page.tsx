"use client";

import { useEffect, useState } from "react";
import { RequireAuth } from "@/components/RequireAuth";
import { AppShell } from "@/components/AppShell";
import { Skeleton } from "@/components/Skeleton";
import { StatusBadge } from "@/components/StatusBadge";
import { useSettings } from "@/lib/settings-context";
import { formatDate, MISSION_CATEGORY_EMOJI } from "@/lib/utils";
import type { SubmissionWithRelations } from "@/lib/types";

export default function SubmissionsPage() {
  return (
    <RequireAuth>
      <AppShell>
        <SubmissionsContent />
      </AppShell>
    </RequireAuth>
  );
}

function SubmissionsContent() {
  const { t } = useSettings();
  const [items, setItems] = useState<SubmissionWithRelations[] | null>(null);

  useEffect(() => {
    fetch("/api/submissions")
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) setItems(data.submissions);
      })
      .catch(() => setItems([]));
  }, []);

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-stone-900">{t("mySubmissions.title")}</h1>
      </div>

      {items === null && (
        <div className="flex flex-col gap-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      )}

      {items?.length === 0 && (
        <p className="rounded-2xl bg-white p-8 text-center text-stone-500 shadow-sm">{t("mySubmissions.empty")}</p>
      )}

      <div className="flex flex-col gap-3">
        {items?.map((item) => (
          <div key={item.id} className="card-surface rounded-2xl p-4 shadow-sm sm:flex sm:gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.fotoUrl}
              alt={item.mission?.titulo ?? ""}
              className="mb-3 h-40 w-full rounded-xl object-cover sm:mb-0 sm:h-24 sm:w-32 sm:shrink-0"
            />
            <div className="flex-1">
              <div className="mb-1 flex items-start justify-between gap-2">
                <h3 className="flex items-center gap-1.5 font-semibold text-stone-900">
                  {MISSION_CATEGORY_EMOJI[item.mission?.categoria ?? "outro"] ?? "🌱"} {item.mission?.titulo}
                </h3>
                <StatusBadge status={item.status} />
              </div>
              <p className="mb-1 text-xs text-stone-400">{formatDate(item.createdAt)}</p>
              <p className="line-clamp-2 text-sm text-stone-600">{item.relatorioTexto}</p>
              {item.status === "rejeitada" && item.motivoRejeicao && (
                <p className="mt-2 rounded-lg bg-red-50 px-2 py-1 text-xs font-medium text-red-700">
                  {t("mySubmissions.reason")}: {item.motivoRejeicao}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

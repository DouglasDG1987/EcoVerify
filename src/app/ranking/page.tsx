"use client";

import { useEffect, useState } from "react";
import { Trophy, Medal } from "lucide-react";
import { RequireAuth } from "@/components/RequireAuth";
import { AppShell } from "@/components/AppShell";
import { Skeleton } from "@/components/Skeleton";
import { useSettings } from "@/lib/settings-context";
import { cn } from "@/lib/utils";
import type { LeaderboardEntry } from "@/lib/types";

export default function RankingPage() {
  return (
    <RequireAuth>
      <AppShell>
        <RankingContent />
      </AppShell>
    </RequireAuth>
  );
}

const MEDAL_COLORS = ["text-yellow-500", "text-stone-400", "text-amber-700"];

function RankingContent() {
  const { t } = useSettings();
  const [entries, setEntries] = useState<LeaderboardEntry[] | null>(null);

  useEffect(() => {
    fetch("/api/leaderboard?limit=50")
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) setEntries(data.leaderboard);
      })
      .catch(() => setEntries([]));
  }, []);

  return (
    <div className="animate-fade-in">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-yellow-400 to-amber-500 text-white shadow-md">
          <Trophy className="h-7 w-7" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-stone-900">{t("ranking.title")}</h1>
          <p className="text-sm text-stone-500">{t("ranking.subtitle")}</p>
        </div>
      </div>

      {entries === null && (
        <div className="flex flex-col gap-2">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      )}

      <div className="card-surface overflow-hidden rounded-2xl shadow-sm">
        {entries?.map((entry, idx) => (
          <div
            key={entry.id}
            className={cn(
              "flex items-center justify-between border-b border-stone-100 px-4 py-3 last:border-b-0",
              idx < 3 && "bg-brand-50/40",
            )}
          >
            <div className="flex items-center gap-3">
              <span className={cn("flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold", idx < 3 ? "bg-white shadow-sm" : "bg-stone-100 text-stone-500")}>
                {idx < 3 ? <Medal className={cn("h-5 w-5", MEDAL_COLORS[idx])} /> : idx + 1}
              </span>
              <span className="font-medium text-stone-800">{entry.nome}</span>
            </div>
            <span className="font-bold text-brand-700">
              {entry.pontosTotais} <span className="font-normal text-stone-400">{t("ranking.points")}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

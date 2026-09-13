"use client";

import { Coins, Sparkles } from "lucide-react";
import type { Mission } from "@/lib/types";
import { MISSION_CATEGORY_EMOJI, formatFone } from "@/lib/utils";
import { useSettings } from "@/lib/settings-context";

export function MissionCard({ mission, onSelect }: { mission: Mission; onSelect: (mission: Mission) => void }) {
  const { t } = useSettings();
  return (
    <div className="card-surface flex flex-col justify-between rounded-2xl p-5 shadow-sm transition-shadow hover:shadow-md animate-fade-in">
      <div>
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-2xl">
            {MISSION_CATEGORY_EMOJI[mission.categoria] ?? "🌱"}
          </div>
          <div>
            <h3 className="font-semibold text-stone-900">{mission.titulo}</h3>
            <p className="text-xs uppercase tracking-wide text-stone-400">{mission.categoria}</p>
          </div>
        </div>
        <p className="mb-4 line-clamp-3 text-sm text-stone-600">{mission.descricao}</p>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-sm">
          <span className="flex items-center gap-1 font-semibold text-brand-700">
            <Sparkles className="h-4 w-4" /> {mission.pontosRecompensa} {t("feed.points")}
          </span>
          <span className="flex items-center gap-1 font-semibold text-teal-700">
            <Coins className="h-4 w-4" /> {formatFone(mission.foneRecompensaEstimado)} FONE
          </span>
        </div>
      </div>
      <button
        onClick={() => onSelect(mission)}
        className="mt-4 w-full rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 active:scale-[0.99]"
      >
        {t("feed.submit")}
      </button>
    </div>
  );
}

import { categoryEmoji, categoryLabels, t, type Lang } from "@/lib/i18n";
import { SubmitProofModal } from "@/components/missions/submit-proof-modal";

const categoryStyles: Record<string, string> = {
  planting: "from-emerald-400 to-emerald-600",
  donation: "from-amber-400 to-orange-500",
  recycling: "from-teal-400 to-teal-600",
  cleanup: "from-sky-400 to-blue-500",
  other: "from-lime-400 to-green-500",
};

export function MissionCard({
  lang,
  mission,
}: {
  lang: Lang;
  mission: {
    id: string;
    title: string;
    description: string;
    category: string;
    pointsReward: number;
    foneReward: string;
  };
}) {
  return (
    <div className="card-surface flex flex-col rounded-2xl border border-black/5 bg-white p-5 shadow-[0_10px_30px_rgba(16,24,40,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(16,24,40,0.1)] animate-slide-up">
      <div
        className={`mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br text-3xl text-white shadow-md ${categoryStyles[mission.category] ?? categoryStyles.other}`}
      >
        {categoryEmoji[mission.category] ?? "🌱"}
      </div>
      <span className="mb-1 w-fit rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
        {categoryLabels[mission.category]?.[lang] ?? mission.category}
      </span>
      <h3 className="text-lg font-bold text-slate-900">{mission.title}</h3>
      <p className="mt-1 flex-1 text-sm text-slate-500 line-clamp-3">{mission.description}</p>
      <div className="mt-4 flex items-center gap-3 text-sm font-semibold">
        <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-amber-700">
          ⭐ {mission.pointsReward}
        </span>
        <span className="flex items-center gap-1 rounded-full bg-teal-50 px-2.5 py-1 text-teal-700">
          🪙 {mission.foneReward} FONE
        </span>
      </div>
      <SubmitProofModal lang={lang} mission={mission} />
    </div>
  );
}

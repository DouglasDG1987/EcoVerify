"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Clock, Coins, Percent, ShieldCheck, Sparkles, Users, XCircle } from "lucide-react";
import { Skeleton } from "@/components/Skeleton";
import { useSettings } from "@/lib/settings-context";
import { formatFone } from "@/lib/utils";
import type { AdminMetrics } from "@/lib/types";

const CARD_ICONS = [Clock, CheckCircle2, XCircle, Percent, Sparkles, Users, Coins, ShieldCheck];

export function MetricsTab() {
  const { t } = useSettings();
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);

  useEffect(() => {
    fetch("/api/admin/metrics")
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) setMetrics(data.metrics);
      })
      .catch(() => setMetrics(null));
  }, []);

  if (!metrics) {
    return (
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  const cards = [
    { label: t("admin.metrics.pending"), value: metrics.pendentes, color: "text-amber-600 bg-amber-50" },
    { label: t("admin.metrics.approved"), value: metrics.aprovadas, color: "text-brand-700 bg-brand-50" },
    { label: t("admin.metrics.rejected"), value: metrics.rejeitadas, color: "text-red-600 bg-red-50" },
    { label: t("admin.metrics.approvalRate"), value: `${(metrics.taxaAprovacao * 100).toFixed(1)}%`, color: "text-teal-700 bg-teal-50" },
    { label: t("admin.metrics.pointsDistributed"), value: metrics.pontosDistribuidos, color: "text-brand-700 bg-brand-50" },
    { label: t("admin.metrics.totalUsers"), value: metrics.totalUsuarios, color: "text-stone-700 bg-stone-100" },
    { label: t("admin.metrics.fonePending"), value: `${formatFone(metrics.foneParado)} FONE`, color: "text-amber-700 bg-amber-50" },
    { label: t("admin.metrics.fonePaid"), value: `${formatFone(metrics.fonePago)} FONE`, color: "text-brand-700 bg-brand-50" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {cards.map((card, i) => {
          const Icon = CARD_ICONS[i];
          return (
            <div key={card.label} className="card-surface rounded-2xl p-4 shadow-sm animate-fade-in">
              <div className={`mb-2 flex h-9 w-9 items-center justify-center rounded-xl ${card.color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <p className="text-xl font-extrabold text-stone-900">{card.value}</p>
              <p className="text-xs text-stone-500">{card.label}</p>
            </div>
          );
        })}
      </div>

      <div className="card-surface rounded-2xl p-5 shadow-sm">
        <h3 className="mb-3 font-semibold text-stone-900">{t("ranking.title")}</h3>
        <div className="flex flex-col gap-2">
          {metrics.ranking.map((entry, idx) => (
            <div key={entry.id} className="flex items-center justify-between border-b border-stone-100 py-2 last:border-0">
              <span className="text-sm text-stone-700">
                <span className="mr-2 font-bold text-stone-400">#{idx + 1}</span>
                {entry.nome}
              </span>
              <span className="text-sm font-bold text-brand-700">{entry.pontosTotais}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

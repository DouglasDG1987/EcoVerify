"use client";

import { useEffect, useState } from "react";
import { Skeleton } from "@/components/Skeleton";
import { useSettings } from "@/lib/settings-context";
import { useToast } from "@/components/Toast";
import { formatDate, formatFone, cn } from "@/lib/utils";
import type { RewardRede, RewardStatus } from "@/lib/types";

interface RewardItem {
  id: string;
  userId: string;
  submissionId: string;
  valorFone: string;
  status: RewardStatus;
  txHash: string | null;
  rede: RewardRede;
  createdAt: string;
  usuarioNome: string;
}

const STATUSES: RewardStatus[] = ["pendente", "em_processamento", "pago", "falhou"];
const NETWORKS: RewardRede[] = ["fone_nativo", "bep20_bsc"];

const STATUS_COLORS: Record<RewardStatus, string> = {
  pendente: "bg-amber-100 text-amber-800",
  em_processamento: "bg-teal-100 text-teal-800",
  pago: "bg-brand-100 text-brand-800",
  falhou: "bg-red-100 text-red-800",
};

export function RewardsTab() {
  const { t } = useSettings();
  const { show } = useToast();
  const [items, setItems] = useState<RewardItem[] | null>(null);
  const [drafts, setDrafts] = useState<Record<string, { txHash: string }>>({});

  const load = () => {
    fetch("/api/admin/reward-queue")
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) setItems(data.rewardQueue);
      })
      .catch(() => setItems([]));
  };

  useEffect(() => {
    load();
  }, []);

  const updateItem = async (id: string, patch: Record<string, unknown>) => {
    try {
      const res = await fetch(`/api/admin/reward-queue/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        show(data.error ?? t("auth.errorGeneric"), "error");
        return;
      }
      show("Registro atualizado.", "success");
      load();
    } catch {
      show(t("auth.errorGeneric"), "error");
    }
  };

  if (items === null) {
    return (
      <div className="flex flex-col gap-3">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {items.map((item) => {
        const draft = drafts[item.id] ?? { txHash: item.txHash ?? "" };
        return (
          <div key={item.id} className="card-surface rounded-2xl p-4 shadow-sm">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-semibold text-stone-900">{item.usuarioNome}</p>
                <p className="text-xs text-stone-400">{formatDate(item.createdAt)}</p>
              </div>
              <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", STATUS_COLORS[item.status])}>
                {item.status}
              </span>
            </div>
            <p className="mb-3 text-lg font-extrabold text-teal-700">{formatFone(item.valorFone)} FONE</p>
            <div className="flex flex-wrap gap-2">
              <select
                value={item.status}
                onChange={(e) => updateItem(item.id, { status: e.target.value })}
                className="rounded-xl border border-stone-300 px-3 py-1.5 text-sm"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <select
                value={item.rede}
                onChange={(e) => updateItem(item.id, { rede: e.target.value })}
                className="rounded-xl border border-stone-300 px-3 py-1.5 text-sm"
              >
                {NETWORKS.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
              <input
                placeholder={t("admin.rewards.txHash")}
                value={draft.txHash}
                onChange={(e) => setDrafts((d) => ({ ...d, [item.id]: { txHash: e.target.value } }))}
                className="min-w-[180px] flex-1 rounded-xl border border-stone-300 px-3 py-1.5 text-sm"
              />
              <button
                onClick={() => updateItem(item.id, { txHash: draft.txHash })}
                className="rounded-xl bg-brand-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-brand-700"
              >
                {t("admin.rewards.save")}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

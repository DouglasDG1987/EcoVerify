"use client";

import { useActionState, useEffect, useState } from "react";
import { updateRewardAction, type AdminActionState } from "@/lib/actions/admin";

const initialState: AdminActionState = {};
const networks = ["EcoChain", "Polygon", "BNB Chain", "Solana"];

export function RewardRow({
  reward,
}: {
  reward: {
    id: string;
    userName: string;
    foneAmount: string;
    status: "pending" | "processing" | "paid" | "failed";
    network: string | null;
    txHash: string | null;
  };
}) {
  const [state, formAction, pending] = useActionState(updateRewardAction, initialState);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (state.success) {
      setSaved(true);
      const timeout = setTimeout(() => setSaved(false), 2000);
      return () => clearTimeout(timeout);
    }
  }, [state.success]);

  return (
    <form action={formAction} className="grid grid-cols-1 items-center gap-3 rounded-xl border border-black/5 p-4 lg:grid-cols-6">
      <input type="hidden" name="rewardId" value={reward.id} />
      <div className="lg:col-span-1">
        <p className="text-sm font-semibold text-slate-800">{reward.userName}</p>
        <p className="text-xs font-bold text-teal-700">🪙 {reward.foneAmount} FONE</p>
      </div>
      <select
        name="status"
        defaultValue={reward.status}
        className="rounded-lg border border-slate-200 px-2 py-2 text-xs font-semibold text-slate-600"
      >
        <option value="pending">Pendente</option>
        <option value="processing">Em processamento</option>
        <option value="paid">Pago</option>
        <option value="failed">Falhou</option>
      </select>
      <select
        name="network"
        defaultValue={reward.network ?? "EcoChain"}
        className="rounded-lg border border-slate-200 px-2 py-2 text-xs font-semibold text-slate-600"
      >
        {networks.map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>
      <input
        type="text"
        name="txHash"
        defaultValue={reward.txHash ?? ""}
        placeholder="Hash da transação"
        className="rounded-lg border border-slate-200 px-2 py-2 text-xs text-slate-600 lg:col-span-2"
      />
      <button
        type="submit"
        disabled={pending}
        className="flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-70"
      >
        {pending && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
        {saved ? "Salvo ✓" : "Salvar"}
      </button>
    </form>
  );
}

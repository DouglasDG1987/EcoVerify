import { RewardRow } from "@/components/admin/reward-row";

export function RewardsTab({
  rewards,
}: {
  rewards: {
    id: string;
    userName: string;
    foneAmount: string;
    status: "pending" | "processing" | "paid" | "failed";
    network: string | null;
    txHash: string | null;
  }[];
}) {
  return (
    <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
      <h3 className="mb-3 font-bold text-slate-900">Fila de pagamentos em FONE</h3>
      {rewards.length === 0 ? (
        <p className="py-10 text-center text-sm text-slate-400">Nenhuma recompensa na fila ainda.</p>
      ) : (
        <div className="space-y-2">
          {rewards.map((reward) => (
            <RewardRow key={reward.id} reward={reward} />
          ))}
        </div>
      )}
    </div>
  );
}

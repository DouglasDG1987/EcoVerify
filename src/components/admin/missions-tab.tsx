import { MissionForm } from "@/components/admin/mission-form";
import { MissionRow } from "@/components/admin/mission-row";

export function MissionsTab({
  missions,
}: {
  missions: {
    id: string;
    title: string;
    category: string;
    pointsReward: number;
    foneReward: string;
    isActive: boolean;
  }[];
}) {
  return (
    <div className="space-y-6">
      <MissionForm />
      <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
        <h3 className="mb-3 font-bold text-slate-900">Todas as missões</h3>
        <div className="space-y-2">
          {missions.map((mission) => (
            <MissionRow key={mission.id} mission={mission} />
          ))}
        </div>
      </div>
    </div>
  );
}

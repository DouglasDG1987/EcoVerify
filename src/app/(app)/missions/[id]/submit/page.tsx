import { eq } from "drizzle-orm";
import { db } from "@/db";
import { missions } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { SubmitProofForm } from "@/components/missions/submit-proof-form";

export default async function SubmitMissionPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const missionList = await db.select().from(missions).where(eq(missions.id, id));
  const mission = missionList[0];

  if (!mission || !mission.isActive) {
    notFound();
  }

  return (
    <div className="max-w-2xl mx-auto">
      <SubmitProofForm
        lang={user.language}
        mission={{
          id: mission.id,
          title: mission.title,
          titleEn: mission.titleEn,
          titleEs: mission.titleEs,
          category: mission.category,
          pointsReward: mission.pointsReward,
          foneReward: mission.foneReward,
        }}
      />
    </div>
  );
}

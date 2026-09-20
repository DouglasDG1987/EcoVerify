import { asc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { missions, submissions, users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { t } from "@/lib/i18n";
import { ModerationCard } from "@/components/moderation/moderation-card";
import { Shield } from "@/components/ui/icons";

export default async function ModerationPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "moderator" && user.role !== "admin") redirect("/missions");

  const rows = await db
    .select({
      id: submissions.id,
      photoUrl: submissions.photoUrl,
      report: submissions.report,
      latitude: submissions.latitude,
      longitude: submissions.longitude,
      submittedAt: submissions.submittedAt,
      missionTitle: missions.title,
      missionCategory: missions.category,
      authorId: users.id,
      authorName: users.name,
    })
    .from(submissions)
    .innerJoin(missions, eq(submissions.missionId, missions.id))
    .innerJoin(users, eq(submissions.userId, users.id))
    .where(eq(submissions.status, "pending"))
    .orderBy(asc(submissions.submittedAt));

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">{t(user.language, "moderation_title")}</h1>
      <p className="mt-1 text-sm text-slate-500">{t(user.language, "moderation_subtitle")}</p>

      {rows.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center text-slate-400">
          <Shield className="h-16 w-16 mx-auto" />
          <p className="mt-3 text-sm font-medium">{t(user.language, "moderation_empty")}</p>
        </div>
      ) : (
        <div className="mt-6 space-y-5">
          {rows.map((row) => (
            <ModerationCard key={row.id} lang={user.language} moderatorId={user.id} submission={row} />
          ))}
        </div>
      )}
    </div>
  );
}

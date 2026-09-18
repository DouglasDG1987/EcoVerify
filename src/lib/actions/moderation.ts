"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { missions, notifications, pointsLedger, rewardQueue, submissions, users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

export type ModerationActionState = { error?: string; success?: boolean };

async function assertModerator() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "moderator" && user.role !== "admin") redirect("/missions");
  return user;
}

export async function approveSubmissionAction(
  _prev: ModerationActionState,
  formData: FormData,
): Promise<ModerationActionState> {
  const moderator = await assertModerator();
  const submissionId = String(formData.get("submissionId") ?? "");

  const [submission] = await db
    .select()
    .from(submissions)
    .where(eq(submissions.id, submissionId))
    .limit(1);

  if (!submission) return { error: "not_found" };
  if (submission.status !== "pending") return { error: "already_reviewed" };
  if (submission.userId === moderator.id) return { error: "own_submission" };

  const [mission] = await db.select().from(missions).where(eq(missions.id, submission.missionId)).limit(1);
  if (!mission) return { error: "mission_not_found" };

  await db
    .update(submissions)
    .set({
      status: "approved",
      reviewedBy: moderator.id,
      reviewedAt: new Date(),
      rejectionReason: null,
    })
    .where(eq(submissions.id, submissionId));

  await db.insert(pointsLedger).values({
    userId: submission.userId,
    submissionId: submission.id,
    points: mission.pointsReward,
  });

  await db
    .update(users)
    .set({ totalPoints: sql`${users.totalPoints} + ${mission.pointsReward}` })
    .where(eq(users.id, submission.userId));

  await db.insert(rewardQueue).values({
    userId: submission.userId,
    submissionId: submission.id,
    foneAmount: mission.foneReward,
    status: "pending",
  });

  const [submitter] = await db.select().from(users).where(eq(users.id, submission.userId)).limit(1);
  if (submitter?.notificationsEnabled) {
    await db.insert(notifications).values({
      userId: submission.userId,
      type: "system",
      title: "Comprovação aprovada! 🎉",
      message: `Sua comprovação para "${mission.title}" foi aprovada. Você ganhou ${mission.pointsReward} pontos e ${mission.foneReward} FONE entrou na fila de pagamento.`,
    });
  }

  revalidatePath("/moderation");
  revalidatePath("/submissions");
  revalidatePath("/ranking");
  revalidatePath("/profile");
  revalidatePath("/admin");
  revalidatePath("/notifications");

  return { success: true };
}

export async function rejectSubmissionAction(
  _prev: ModerationActionState,
  formData: FormData,
): Promise<ModerationActionState> {
  const moderator = await assertModerator();
  const submissionId = String(formData.get("submissionId") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();

  if (reason.length < 5) {
    return { error: "reason_too_short" };
  }

  const [submission] = await db
    .select()
    .from(submissions)
    .where(eq(submissions.id, submissionId))
    .limit(1);

  if (!submission) return { error: "not_found" };
  if (submission.status !== "pending") return { error: "already_reviewed" };
  if (submission.userId === moderator.id) return { error: "own_submission" };

  const [mission] = await db.select().from(missions).where(eq(missions.id, submission.missionId)).limit(1);

  await db
    .update(submissions)
    .set({
      status: "rejected",
      reviewedBy: moderator.id,
      reviewedAt: new Date(),
      rejectionReason: reason,
    })
    .where(eq(submissions.id, submissionId));

  const [submitter] = await db.select().from(users).where(eq(users.id, submission.userId)).limit(1);
  if (submitter?.notificationsEnabled) {
    await db.insert(notifications).values({
      userId: submission.userId,
      type: "alert",
      title: "Comprovação rejeitada",
      message: `Sua comprovação para "${mission?.title ?? "missão"}" foi rejeitada. Motivo: ${reason}`,
    });
  }

  revalidatePath("/moderation");
  revalidatePath("/submissions");
  revalidatePath("/notifications");

  return { success: true };
}

export async function getUserHistory(userId: string) {
  await assertModerator();
  return db
    .select({
      id: submissions.id,
      status: submissions.status,
      report: submissions.report,
      submittedAt: submissions.submittedAt,
      missionTitle: missions.title,
      rejectionReason: submissions.rejectionReason,
    })
    .from(submissions)
    .innerJoin(missions, eq(submissions.missionId, missions.id))
    .where(eq(submissions.userId, userId))
    .orderBy(sql`${submissions.submittedAt} desc`);
}

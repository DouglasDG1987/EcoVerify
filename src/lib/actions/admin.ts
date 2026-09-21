"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { missions, notifications, rewardQueue, users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

export type AdminActionState = { error?: string; success?: boolean };

async function assertAdmin() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/missions");
  return user;
}

export async function createMissionAction(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const admin = await assertAdmin();
  const title = String(formData.get("title") ?? "").trim();
  const titleEn = String(formData.get("titleEn") ?? "").trim() || null;
  const titleEs = String(formData.get("titleEs") ?? "").trim() || null;
  const description = String(formData.get("description") ?? "").trim();
  const descriptionEn = String(formData.get("descriptionEn") ?? "").trim() || null;
  const descriptionEs = String(formData.get("descriptionEs") ?? "").trim() || null;
  const context = String(formData.get("context") ?? "").trim() || null;
  const impact = String(formData.get("impact") ?? "").trim() || null;
  const latitude = Number(formData.get("latitude"));
  const longitude = Number(formData.get("longitude"));
  const category = String(formData.get("category") ?? "other") as
    | "planting"
    | "donation"
    | "recycling"
    | "cleanup"
    | "other";
  const pointsReward = Number(formData.get("pointsReward") ?? 0);
  const foneReward = String(formData.get("foneReward") ?? "0");

  if (!title || !description || !context || !impact || !pointsReward ||
      !Number.isFinite(latitude) || !Number.isFinite(longitude) ||
      latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return { error: "invalid" };
  }

  await db.insert(missions).values({
    title,
    titleEn,
    titleEs,
    description,
    descriptionEn,
    descriptionEs,
    context,
    impact,
    latitude,
    longitude,
    category,
    pointsReward,
    foneReward,
    createdBy: admin.id,
  });

  revalidatePath("/admin");
  revalidatePath("/missions");
  return { success: true };
}

export async function toggleMissionAction(missionId: string, isActive: boolean) {
  await assertAdmin();
  await db.update(missions).set({ isActive }).where(eq(missions.id, missionId));
  revalidatePath("/admin");
  revalidatePath("/missions");
}

export async function updateUserRoleAction(userId: string, role: "citizen" | "moderator" | "admin") {
  const admin = await assertAdmin();
  if (admin.id === userId) return;
  await db.update(users).set({ role }).where(eq(users.id, userId));
  revalidatePath("/admin");
}

export async function banUserAction(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const admin = await assertAdmin();
  const userId = String(formData.get("userId") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  if (admin.id === userId) return { error: "self" };
  if (!reason) return { error: "reason_required" };

  await db.update(users).set({ isBanned: true, banReason: reason }).where(eq(users.id, userId));
  revalidatePath("/admin");
  return { success: true };
}

export async function unbanUserAction(userId: string) {
  const admin = await assertAdmin();
  if (admin.id === userId) return;
  await db.update(users).set({ isBanned: false, banReason: null }).where(eq(users.id, userId));
  revalidatePath("/admin");
}

export async function contactUserAction(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  await assertAdmin();
  const userId = String(formData.get("userId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();

  if (!title || !message) return { error: "invalid" };

  await db.insert(notifications).values({
    userId,
    type: "admin",
    title,
    message,
  });

  revalidatePath("/admin");
  revalidatePath("/notifications");
  return { success: true };
}

export async function updateRewardAction(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  await assertAdmin();
  const rewardId = String(formData.get("rewardId") ?? "");
  const status = String(formData.get("status") ?? "pending") as
    | "pending"
    | "processing"
    | "paid"
    | "failed";
  const network = String(formData.get("network") ?? "").trim();
  const txHash = String(formData.get("txHash") ?? "").trim();

  await db
    .update(rewardQueue)
    .set({
      status,
      network: network || null,
      txHash: txHash || null,
      updatedAt: new Date(),
    })
    .where(eq(rewardQueue.id, rewardId));

  revalidatePath("/admin");
  return { success: true };
}

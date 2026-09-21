"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq, gte } from "drizzle-orm";
import crypto from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { db } from "@/db";
import { missions, submissions } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { startOfTodayUTC } from "@/lib/utils";

export type SubmissionActionState = { error?: string; success?: boolean };

const MISSION_RADIUS_METERS = 150;

function distanceInMeters(latitude: number, longitude: number, targetLatitude: number, targetLongitude: number) {
  const earthRadius = 6371000;
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const latitudeDelta = toRadians(targetLatitude - latitude);
  const longitudeDelta = toRadians(targetLongitude - longitude);
  const a = Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(toRadians(latitude)) * Math.cos(toRadians(targetLatitude)) * Math.sin(longitudeDelta / 2) ** 2;
  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function createSubmissionAction(
  _prev: SubmissionActionState,
  formData: FormData,
): Promise<SubmissionActionState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.isBanned) return { error: "banned" };

  const missionId = String(formData.get("missionId") ?? "");
  const report = String(formData.get("report") ?? "").trim();
  const latitude = formData.get("latitude");
  const longitude = formData.get("longitude");
  const photo = formData.get("photo");

  if (!missionId) return { error: "invalid" };

  if (!(photo instanceof File) || photo.size === 0) {
    return { error: "photo_required" };
  }

  if (report.length < 50 || report.length > 1000) {
    return { error: "report_length" };
  }

  const [mission] = await db.select().from(missions).where(eq(missions.id, missionId)).limit(1);
  if (!mission || !mission.isActive) {
    return { error: "mission_not_found" };
  }

  const userLatitude = Number(latitude);
  const userLongitude = Number(longitude);
  if (!mission.latitude || !mission.longitude) return { error: "mission_location_not_configured" };
  if (!Number.isFinite(userLatitude) || !Number.isFinite(userLongitude)) return { error: "outside_mission_area" };
  if (distanceInMeters(userLatitude, userLongitude, Number(mission.latitude), Number(mission.longitude)) > MISSION_RADIUS_METERS) {
    return { error: "outside_mission_area" };
  }

  const todayStart = startOfTodayUTC();
  const todayCountRows = await db
    .select({ id: submissions.id })
    .from(submissions)
    .where(and(eq(submissions.userId, user.id), gte(submissions.submittedAt, todayStart)));

  if (todayCountRows.length >= 5) {
    return { error: "daily_limit" };
  }

  const arrayBuffer = await photo.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const photoHash = crypto.createHash("sha256").update(buffer).digest("hex");

  const [duplicate] = await db
    .select({ id: submissions.id })
    .from(submissions)
    .where(eq(submissions.photoHash, photoHash))
    .limit(1);

  if (duplicate) {
    return { error: "duplicate_photo" };
  }

  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadsDir, { recursive: true });
  const extension = photo.type === "image/png" ? "png" : "jpg";
  const fileName = `${crypto.randomUUID()}.${extension}`;
  await writeFile(path.join(uploadsDir, fileName), buffer);
  const photoUrl = `/uploads/${fileName}`;

  await db.insert(submissions).values({
    userId: user.id,
    missionId,
    photoUrl,
    photoHash,
    report,
    latitude: userLatitude,
    longitude: userLongitude,
  });

  revalidatePath("/submissions");
  revalidatePath("/moderation");
  revalidatePath("/missions");

  return { success: true };
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import type { ActionState } from "@/lib/actions/auth";

export async function updateSettingsAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const language = String(formData.get("language") ?? "pt") as "pt" | "en" | "es";
  const fontSize = String(formData.get("fontSize") ?? "medium") as "small" | "medium" | "large";
  const highContrast = formData.get("highContrast") === "on";
  const reducedMotion = formData.get("reducedMotion") === "on";
  const notificationsEnabled = formData.get("notificationsEnabled") === "on";

  await db
    .update(users)
    .set({ language, fontSize, highContrast, reducedMotion, notificationsEnabled })
    .where(eq(users.id, user.id));

  revalidatePath("/", "layout");
  return {};
}

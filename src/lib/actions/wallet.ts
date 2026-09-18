"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import crypto from "node:crypto";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import type { ActionState } from "@/lib/actions/auth";

function generateWalletAddress() {
  return "0xFONE" + crypto.randomBytes(16).toString("hex");
}

export async function createWalletAction() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  await db
    .update(users)
    .set({ walletAddress: generateWalletAddress() })
    .where(eq(users.id, user.id));
  redirect("/missions");
}

export async function importWalletAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const address = String(formData.get("address") ?? "").trim();
  if (address.length < 6) {
    return { error: "invalid_address" };
  }
  await db.update(users).set({ walletAddress: address }).where(eq(users.id, user.id));
  redirect("/missions");
}

export async function skipWalletAction() {
  redirect("/missions");
}

export async function updateWalletFromProfileAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const address = String(formData.get("address") ?? "").trim();
  if (address.length < 6) {
    return { error: "invalid_address" };
  }
  await db.update(users).set({ walletAddress: address }).where(eq(users.id, user.id));
  revalidatePath("/profile");
  return {};
}

export async function createWalletFromProfileAction() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  await db
    .update(users)
    .set({ walletAddress: generateWalletAddress() })
    .where(eq(users.id, user.id));
  revalidatePath("/profile");
}

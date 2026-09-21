"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { communityChat, messageFavorites, messageReports, notifications, users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
export type ActionState = { error?: string };

export async function sendMessageAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "citizen") return { error: "not_citizen" };

  const message = String(formData.get("message") ?? "").trim();
  const messageType = String(formData.get("messageType") ?? "text") as "text" | "image" | "audio" | "video" | "gif";
  const mediaUrl = String(formData.get("mediaUrl") ?? "") || null;
  const replyToId = String(formData.get("replyToId") ?? "") || null;
  const replyToMessage = String(formData.get("replyToMessage") ?? "") || null;

  // Para mensagens de mídia, não requer texto
  if (messageType === "text" && !message) {
    return { error: "empty_message" };
  }

  if (message && message.length > 1000) {
    return { error: "message_too_long" };
  }

  await db.insert(communityChat).values({
    message: message || null,
    messageType,
    mediaUrl,
    replyToId,
    replyToMessage,
    userId: user.id,
  });

  // Notificar todos os usuários cidadãos sobre nova mensagem
  const allCitizens = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.role, "citizen"));

  for (const citizen of allCitizens) {
    if (citizen.id !== user.id) {
      await db.insert(notifications).values({
        userId: citizen.id,
        type: "system",
        title: "Nova mensagem na comunidade",
        message: `Há uma nova mensagem no chat da comunidade.`,
      });
    }
  }

  revalidatePath("/community");
  revalidatePath("/notifications");
  return {};
}

export async function editMessageAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "citizen") return { error: "not_citizen" };

  const messageId = String(formData.get("messageId") ?? "");
  const newMessage = String(formData.get("message") ?? "").trim();

  if (!messageId || !newMessage) {
    return { error: "invalid" };
  }

  if (newMessage.length > 1000) {
    return { error: "message_too_long" };
  }

  // Verificar se a mensagem pertence ao usuário e se já foi editada
  const existingMessage = await db
    .select()
    .from(communityChat)
    .where(eq(communityChat.id, messageId))
    .limit(1);

  if (!existingMessage[0]) {
    return { error: "not_found" };
  }

  if (existingMessage[0].userId !== user.id) {
    return { error: "not_owner" };
  }

  if (existingMessage[0].editedAt) {
    return { error: "already_edited" };
  }

  await db
    .update(communityChat)
    .set({
      message: newMessage,
      editedAt: new Date(),
    })
    .where(eq(communityChat.id, messageId));

  revalidatePath("/community");
  return {};
}

export async function deleteMessageAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "citizen") return { error: "not_citizen" };

  const messageId = String(formData.get("messageId") ?? "");
  const deleteForEveryone = formData.get("deleteForEveryone") === "true";

  if (!messageId) {
    return { error: "invalid" };
  }

  const existingMessage = await db
    .select()
    .from(communityChat)
    .where(eq(communityChat.id, messageId))
    .limit(1);

  if (!existingMessage[0]) {
    return { error: "not_found" };
  }

  if (existingMessage[0].userId !== user.id) {
    return { error: "not_owner" };
  }

  if (deleteForEveryone) {
    await db
      .update(communityChat)
      .set({
        deletedAt: new Date(),
        deletedBy: user.id,
        deleteForEveryone: true,
      })
      .where(eq(communityChat.id, messageId));
  } else {
    await db
      .update(communityChat)
      .set({
        deletedAt: new Date(),
        deletedBy: user.id,
        deleteForEveryone: false,
      })
      .where(eq(communityChat.id, messageId));
  }

  revalidatePath("/community");
  return {};
}

export async function toggleFavoriteAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "citizen") return { error: "not_citizen" };

  const messageId = String(formData.get("messageId") ?? "");

  if (!messageId) {
    return { error: "invalid" };
  }

  const existingFavorite = await db
    .select()
    .from(messageFavorites)
    .where(
      and(
        eq(messageFavorites.messageId, messageId),
        eq(messageFavorites.userId, user.id)
      )
    )
    .limit(1);

  if (existingFavorite[0]) {
    await db
      .delete(messageFavorites)
      .where(eq(messageFavorites.id, existingFavorite[0].id));
  } else {
    await db.insert(messageFavorites).values({
      messageId,
      userId: user.id,
    });
  }

  revalidatePath("/community");
  return {};
}

export async function reportMessageAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "citizen") return { error: "not_citizen" };

  const messageId = String(formData.get("messageId") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();

  if (!messageId || !reason) {
    return { error: "invalid" };
  }

  // Verificar se já denunciou
  const existingReport = await db
    .select()
    .from(messageReports)
    .where(
      and(
        eq(messageReports.messageId, messageId),
        eq(messageReports.reporterId, user.id)
      )
    )
    .limit(1);

  if (existingReport[0]) {
    return { error: "already_reported" };
  }

  await db.insert(messageReports).values({
    messageId,
    reporterId: user.id,
    reason,
  });

  revalidatePath("/community");
  return {};
}

export async function getCommunityMessages(limit: number = 50) {
  const messages = await db
    .select({
      id: communityChat.id,
      message: communityChat.message,
      userId: communityChat.userId,
      createdAt: communityChat.createdAt,
      editedAt: communityChat.editedAt,
      deletedAt: communityChat.deletedAt,
      deleteForEveryone: communityChat.deleteForEveryone,
    })
    .from(communityChat)
    .orderBy(communityChat.createdAt)
    .limit(limit);

  return messages;
}

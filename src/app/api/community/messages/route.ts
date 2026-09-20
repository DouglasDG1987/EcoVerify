import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { communityChat, users, messageFavorites } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const messages = await db
      .select({
        id: communityChat.id,
        message: communityChat.message,
        messageType: communityChat.messageType,
        mediaUrl: communityChat.mediaUrl,
        replyToId: communityChat.replyToId,
        replyToMessage: communityChat.replyToMessage,
        userId: communityChat.userId,
        userName: users.name,
        createdAt: communityChat.createdAt,
        editedAt: communityChat.editedAt,
        deletedAt: communityChat.deletedAt,
        deleteForEveryone: communityChat.deleteForEveryone,
      })
      .from(communityChat)
      .leftJoin(users, eq(communityChat.userId, users.id))
      .orderBy(communityChat.createdAt)
      .limit(50);

    const userFavorites = await db
      .select({ messageId: messageFavorites.messageId })
      .from(messageFavorites)
      .where(eq(messageFavorites.userId, user.id));

    const favoriteIds = userFavorites.map((f) => f.messageId);

    return NextResponse.json({
      messages,
      favoriteIds,
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}

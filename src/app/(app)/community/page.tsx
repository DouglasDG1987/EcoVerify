import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { communityChat, users, messageFavorites } from "@/db/schema";
import { t } from "@/lib/i18n";
import { CommunityChat } from "@/components/community/community-chat";
import { CommunityChatRealtime } from "@/components/community/community-chat-realtime";

export default async function CommunityPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "citizen") redirect("/missions");

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

  // Buscar favoritos do usuário atual
  const userFavorites = await db
    .select({ messageId: messageFavorites.messageId })
    .from(messageFavorites)
    .where(eq(messageFavorites.userId, user.id));

  const favoriteMessageIds = new Set(userFavorites.map((f) => f.messageId));

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">{t(user.language, "nav_community")}</h1>
      <p className="mt-1 text-sm text-slate-500">Converse com outros guardiões do planeta</p>

      <CommunityChatRealtime
        lang={user.language}
        initialMessages={messages}
        currentUserId={user.id}
        currentUserName={user.name}
        initialFavoriteIds={favoriteMessageIds}
      />
    </div>
  );
}
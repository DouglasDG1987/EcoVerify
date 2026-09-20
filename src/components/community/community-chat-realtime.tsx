"use client";

import { useState, useEffect } from "react";
import { CommunityChat } from "./community-chat";
import { useRealtimeMessages } from "./use-realtime-messages";

interface CommunityChatRealtimeProps {
  lang: any;
  initialMessages: Array<{
    id: string;
    message: string | null;
    messageType: string;
    mediaUrl: string | null;
    replyToId: string | null;
    replyToMessage: string | null;
    userId: string;
    userName: string | null;
    createdAt: Date;
    editedAt: Date | null;
    deletedAt: Date | null;
    deleteForEveryone: boolean | null;
  }>;
  currentUserId: string;
  currentUserName: string;
  initialFavoriteIds: Set<string>;
}

export function CommunityChatRealtime({
  lang,
  initialMessages,
  currentUserId,
  currentUserName,
  initialFavoriteIds,
}: CommunityChatRealtimeProps) {
  const [messages, setMessages] = useState(initialMessages);
  const [favoriteIds, setFavoriteIds] = useState(initialFavoriteIds);
  const { shouldRefresh } = useRealtimeMessages(5000); // Atualiza a cada 5 segundos

  useEffect(() => {
    // Buscar mensagens atualizadas
    const fetchMessages = async () => {
      try {
        const response = await fetch("/api/community/messages");
        if (response.ok) {
          const data = await response.json();
          setMessages(data.messages);
          setFavoriteIds(new Set(data.favoriteIds));
        }
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    };

    fetchMessages();
  }, [shouldRefresh]);

  return (
    <CommunityChat
      lang={lang}
      messages={messages}
      currentUserId={currentUserId}
      currentUserName={currentUserName}
      favoriteMessageIds={favoriteIds}
    />
  );
}

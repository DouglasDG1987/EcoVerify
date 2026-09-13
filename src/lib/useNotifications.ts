"use client";

import { useEffect, useState, useRef } from "react";
import { LocalNotifications } from "@capacitor/local-notifications";
import { useToast } from "@/components/Toast";
import type { Notification } from "@/lib/types";

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [previousCount, setPreviousCount] = useState(0);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const { show } = useToast();

  const loadNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      if (data.ok) {
        setNotifications(data.notifications);
        const unread = data.notifications.filter((n: Notification) => !n.lida).length;
        setUnreadCount(unread);
        
        // Detectar novas notificações
        if (unread > previousCount && previousCount > 0) {
          const newNotification = data.notifications.find((n: Notification) => !n.lida);
          if (newNotification) {
            await triggerNotification(newNotification);
          }
        }
        setPreviousCount(unread);
      }
    } catch (error) {
      console.error("Erro ao carregar notificações:", error);
    }
  };

  const triggerNotification = async (notification: Notification) => {
    try {
      // Tocar som de notificação (se estiver no app)
      try {
        // Usar Web Audio API para gerar um som simples de notificação
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 800; // Frequência em Hz
        oscillator.type = 'sine';
        gainNode.gain.value = 0.1; // Volume

        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.2); // 200ms de duração
      } catch (e) {
        // Ignorar erro de áudio
      }

      // Mostrar toast no app
      show(notification.mensagem, "notification", notification.titulo);

      // Tentar notificação nativa ( Capacitor )
      try {
        const permission = await LocalNotifications.requestPermissions();
        if (permission.display === "granted") {
          await LocalNotifications.schedule({
            notifications: [
              {
                id: Date.now(),
                title: notification.titulo,
                body: notification.mensagem,
                schedule: { at: new Date() },
                sound: "default",
                smallIcon: "ic_stat_icon_config_sample",
                largeIcon: "ic_launcher_foreground",
              },
            ],
          });
        }
      } catch (capacitorError) {
        console.error("Erro ao enviar notificação Capacitor:", capacitorError);
      }
    } catch (error) {
      console.error("Erro ao enviar notificação local:", error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId }),
      });
      const data = await res.json();
      if (data.ok) {
        loadNotifications();
      }
    } catch (error) {
      console.error("Erro ao marcar notificação como lida:", error);
    }
  };

  useEffect(() => {
    // Carregar notificações iniciais
    loadNotifications();

    // Configurar polling a cada 30 segundos
    pollingRef.current = setInterval(loadNotifications, 30000);

    // Cleanup
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [previousCount]);

  return {
    notifications,
    unreadCount,
    markAsRead,
    refresh: loadNotifications,
  };
}
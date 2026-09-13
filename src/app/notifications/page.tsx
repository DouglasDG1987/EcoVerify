"use client";

import { RequireAuth } from "@/components/RequireAuth";
import { AppShell } from "@/components/AppShell";
import { Skeleton } from "@/components/Skeleton";
import { useSettings } from "@/lib/settings-context";
import { useToast } from "@/components/Toast";
import { useNotifications } from "@/lib/useNotifications";

export default function NotificationsPage() {
  return (
    <RequireAuth>
      <AppShell>
        <NotificationsContent />
      </AppShell>
    </RequireAuth>
  );
}

function NotificationsContent() {
  const { t } = useSettings();
  const { show } = useToast();
  const { notifications, markAsRead } = useNotifications();

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markAsRead(notificationId);
    } catch {
      show(t("auth.errorGeneric"), "error");
    }
  };

  if (notifications === null) {
    return (
      <div className="flex flex-col gap-3">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-stone-500">Nenhuma notificação encontrada.</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <h1 className="mb-6 text-2xl font-extrabold text-stone-900">Notificações</h1>
      <div className="flex flex-col gap-3">
        {notifications.map((n) => (
          <div
            key={n.id}
            className={`card-surface rounded-2xl p-4 shadow-sm cursor-pointer transition-colors hover:bg-stone-50 ${!n.lida ? 'border-l-4 border-brand-500' : ''}`}
            onClick={() => !n.lida && handleMarkAsRead(n.id)}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    n.tipo === 'contato_admin' ? 'bg-blue-100 text-blue-700' :
                    n.tipo === 'alerta' ? 'bg-red-100 text-red-700' :
                    'bg-stone-100 text-stone-700'
                  }`}>
                    {n.tipo === 'contato_admin' ? 'Admin' : n.tipo === 'alerta' ? 'Alerta' : 'Sistema'}
                  </span>
                  {!n.lida && <span className="text-xs font-bold text-brand-600">NOVA</span>}
                </div>
                <h3 className="font-semibold text-stone-900">{n.titulo}</h3>
                <p className="text-sm text-stone-600 mt-1">{n.mensagem}</p>
                <p className="text-xs text-stone-400 mt-2">
                  {new Date(n.createdAt).toLocaleString('pt-BR')}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
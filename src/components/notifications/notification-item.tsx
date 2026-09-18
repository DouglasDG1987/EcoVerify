"use client";

import { useTransition } from "react";
import { markNotificationReadAction } from "@/lib/actions/notifications";
import { formatDate } from "@/lib/utils";
import type { Lang } from "@/lib/i18n";

const typeStyles: Record<string, { bg: string; text: string; label: Record<Lang, string> }> = {
  system: {
    bg: "bg-emerald-100",
    text: "text-emerald-700",
    label: { pt: "Sistema", en: "System", es: "Sistema" },
  },
  admin: {
    bg: "bg-teal-100",
    text: "text-teal-700",
    label: { pt: "Admin", en: "Admin", es: "Admin" },
  },
  alert: {
    bg: "bg-red-100",
    text: "text-red-700",
    label: { pt: "Alerta", en: "Alert", es: "Alerta" },
  },
};

export function NotificationItem({
  lang,
  notification,
}: {
  lang: Lang;
  notification: {
    id: string;
    type: string;
    title: string;
    message: string;
    isRead: boolean;
    createdAt: Date;
  };
}) {
  const [isPending, startTransition] = useTransition();
  const style = typeStyles[notification.type] ?? typeStyles.system;

  return (
    <button
      type="button"
      disabled={notification.isRead || isPending}
      onClick={() => startTransition(() => markNotificationReadAction(notification.id))}
      className={`flex w-full gap-3 rounded-2xl border border-black/5 bg-white p-4 text-left shadow-sm transition animate-slide-up ${
        !notification.isRead ? "ring-1 ring-emerald-200" : ""
      } ${isPending ? "opacity-60" : ""}`}
    >
      <span className={`w-1.5 shrink-0 rounded-full ${notification.isRead ? "bg-transparent" : "bg-emerald-500"}`} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${style.bg} ${style.text}`}>
            {style.label[lang]}
          </span>
          {!notification.isRead && (
            <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">NOVA</span>
          )}
          <span className="ml-auto text-xs text-slate-400">{formatDate(notification.createdAt, lang)}</span>
        </div>
        <p className="mt-1.5 font-semibold text-slate-900">{notification.title}</p>
        <p className="mt-0.5 text-sm text-slate-500">{notification.message}</p>
      </div>
    </button>
  );
}

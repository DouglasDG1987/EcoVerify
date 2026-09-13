"use client";

import { useEffect, useState } from "react";
import { Check, History, MapPin, X } from "lucide-react";
import { RequireAuth } from "@/components/RequireAuth";
import { AppShell } from "@/components/AppShell";
import { Skeleton } from "@/components/Skeleton";
import { RejectModal } from "@/components/RejectModal";
import { UserHistoryDrawer } from "@/components/UserHistoryDrawer";
import { useSettings } from "@/lib/settings-context";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/components/Toast";
import { formatDate, MISSION_CATEGORY_EMOJI } from "@/lib/utils";

interface PendingItem {
  id: string;
  userId: string;
  fotoUrl: string;
  relatorioTexto: string;
  lat: number | null;
  lng: number | null;
  createdAt: string;
  autor: { id: string; nome: string };
  mission: { titulo: string; categoria: string; pontosRecompensa: number; foneRecompensaEstimado: string };
}

export default function ModerationPage() {
  return (
    <RequireAuth roles={["moderator", "admin"]}>
      <AppShell>
        <ModerationContent />
      </AppShell>
    </RequireAuth>
  );
}

function ModerationContent() {
  const { t } = useSettings();
  const { user } = useAuth();
  const { show } = useToast();

  const [items, setItems] = useState<PendingItem[] | null>(null);
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const [historyUserId, setHistoryUserId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = () => {
    fetch("/api/submissions/pending")
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) setItems(data.submissions);
      })
      .catch(() => setItems([]));
  };

  useEffect(() => {
    load();
  }, []);

  const handleApprove = async (id: string) => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/submissions/${id}/approve`, { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        show(data.error ?? t("auth.errorGeneric"), "error");
        return;
      }
      show(t("moderation.approveSuccess"), "success");
      setItems((prev) => prev?.filter((i) => i.id !== id) ?? null);
    } catch {
      show(t("auth.errorGeneric"), "error");
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (motivo: string) => {
    if (!rejectTarget) return;
    setBusyId(rejectTarget);
    try {
      const res = await fetch(`/api/submissions/${rejectTarget}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ motivo }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        show(data.error ?? t("auth.errorGeneric"), "error");
        return;
      }
      show(t("moderation.rejectSuccess"), "success");
      setItems((prev) => prev?.filter((i) => i.id !== rejectTarget) ?? null);
      setRejectTarget(null);
    } catch {
      show(t("auth.errorGeneric"), "error");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-stone-900">{t("moderation.title")}</h1>
        <p className="text-sm text-stone-500">{t("moderation.subtitle")}</p>
      </div>

      {items === null && (
        <div className="flex flex-col gap-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      )}

      {items?.length === 0 && (
        <p className="rounded-2xl bg-white p-8 text-center text-stone-500 shadow-sm">{t("moderation.empty")}</p>
      )}

      <div className="flex flex-col gap-4">
        {items?.map((item) => {
          const isOwn = item.userId === user?.id;
          return (
            <div key={item.id} className="card-surface overflow-hidden rounded-2xl shadow-sm sm:flex">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.fotoUrl} alt={item.mission.titulo} className="h-52 w-full object-cover sm:h-auto sm:w-56" />
              <div className="flex-1 p-4">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <h3 className="flex items-center gap-1.5 font-semibold text-stone-900">
                    {MISSION_CATEGORY_EMOJI[item.mission.categoria] ?? "🌱"} {item.mission.titulo}
                  </h3>
                  <button
                    onClick={() => setHistoryUserId(item.userId)}
                    className="flex items-center gap-1 text-xs font-medium text-teal-700 hover:underline"
                  >
                    <History className="h-3.5 w-3.5" /> {item.autor.nome}
                  </button>
                </div>
                <p className="mb-1 text-xs text-stone-400">{formatDate(item.createdAt)}</p>
                <p className="mb-2 text-sm text-stone-600">{item.relatorioTexto}</p>
                {item.lat !== null && item.lng !== null && (
                  <p className="mb-3 flex items-center gap-1 text-xs text-stone-500">
                    <MapPin className="h-3.5 w-3.5" /> {item.lat.toFixed(4)}, {item.lng.toFixed(4)}
                  </p>
                )}

                {isOwn ? (
                  <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
                    {t("moderation.ownSubmission")}
                  </p>
                ) : (
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleApprove(item.id)}
                      disabled={busyId === item.id}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-brand-600 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
                    >
                      <Check className="h-4 w-4" /> {t("moderation.approve")}
                    </button>
                    <button
                      onClick={() => setRejectTarget(item.id)}
                      disabled={busyId === item.id}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-red-300 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
                    >
                      <X className="h-4 w-4" /> {t("moderation.reject")}
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {rejectTarget && (
        <RejectModal onClose={() => setRejectTarget(null)} onConfirm={handleReject} />
      )}

      {historyUserId && (
        <UserHistoryDrawer userId={historyUserId} onClose={() => setHistoryUserId(null)} />
      )}
    </div>
  );
}

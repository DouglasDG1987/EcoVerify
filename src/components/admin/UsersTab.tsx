"use client";

import { useEffect, useState } from "react";
import { Skeleton } from "@/components/Skeleton";
import { useSettings } from "@/lib/settings-context";
import { useToast } from "@/components/Toast";
import { useAuth } from "@/lib/auth-context";
import type { AdminUser, Role } from "@/lib/types";

const ROLES: Role[] = ["citizen", "moderator", "admin"];

export function UsersTab() {
  const { t } = useSettings();
  const { show } = useToast();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [banModal, setBanModal] = useState<{ userId: string; userName: string } | null>(null);
  const [contactModal, setContactModal] = useState<{ userId: string; userName: string } | null>(null);
  const [banReason, setBanReason] = useState("");
  const [contactTitle, setContactTitle] = useState("");
  const [contactMessage, setContactMessage] = useState("");

  const load = () => {
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) setUsers(data.users);
      })
      .catch(() => setUsers([]));
  };

  useEffect(() => {
    load();
  }, []);

  const changeRole = async (id: string, role: Role) => {
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        show(data.error ?? t("auth.errorGeneric"), "error");
        return;
      }
      show("Papel atualizado.", "success");
      load();
    } catch {
      show(t("auth.errorGeneric"), "error");
    }
  };

  const handleBan = async () => {
    if (!banModal) return;
    try {
      const user = users?.find(u => u.id === banModal.userId);
      const shouldBan = !user?.ativo;

      const res = await fetch(`/api/admin/users/${banModal.userId}/banir`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ativo: shouldBan, motivoBanimento: shouldBan ? banReason : null }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        show(data.error ?? t("auth.errorGeneric"), "error");
        return;
      }
      show(shouldBan ? "Usuário banido com sucesso." : "Usuário desbanido com sucesso.", "success");
      setBanModal(null);
      setBanReason("");
      load();
    } catch {
      show(t("auth.errorGeneric"), "error");
    }
  };

  const handleContact = async () => {
    if (!contactModal) return;
    try {
      const res = await fetch(`/api/admin/users/${contactModal.userId}/contato`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titulo: contactTitle, mensagem: contactMessage }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        show(data.error ?? t("auth.errorGeneric"), "error");
        return;
      }
      show("Mensagem enviada com sucesso.", "success");
      setContactModal(null);
      setContactTitle("");
      setContactMessage("");
    } catch {
      show(t("auth.errorGeneric"), "error");
    }
  };

  if (users === null) {
    return (
      <div className="flex flex-col gap-3">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {users.map((u) => (
        <div key={u.id} className={`card-surface flex flex-wrap items-center justify-between gap-3 rounded-2xl p-4 shadow-sm ${!u.ativo ? 'border-l-4 border-red-500 opacity-70' : ''}`}>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-stone-900">{u.nome}</p>
              {!u.ativo && <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">BANIDO</span>}
            </div>
            <p className="text-xs text-stone-500">{u.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-stone-400">Role: {u.role}</span>
              <span className="text-xs text-stone-400">•</span>
              <span className="text-xs text-stone-400">Cadastrado: {new Date(u.createdAt).toLocaleDateString('pt-BR')}</span>
            </div>
            {u.motivoBanimento && (
              <p className="text-xs text-red-600 mt-1">Motivo: {u.motivoBanimento}</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-brand-700">{u.pontosTotais} pts</span>
            <select
              value={u.role}
              disabled={u.id === currentUser?.id || !u.ativo}
              onChange={(e) => changeRole(u.id, e.target.value as Role)}
              className="rounded-xl border border-stone-300 px-3 py-1.5 text-sm disabled:opacity-50"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <button
              onClick={() => setContactModal({ userId: u.id, userName: u.nome })}
              className="rounded-xl bg-blue-100 px-3 py-1.5 text-sm font-semibold text-blue-700 hover:bg-blue-200 transition-colors"
            >
              Contato
            </button>
            <button
              onClick={() => setBanModal({ userId: u.id, userName: u.nome })}
              disabled={u.id === currentUser?.id}
              className={`rounded-xl px-3 py-1.5 text-sm font-semibold transition-colors ${u.ativo ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-green-100 text-green-700 hover:bg-green-200'} disabled:opacity-50`}
            >
              {u.ativo ? "Banir" : "Desbanir"}
            </button>
          </div>
        </div>
      ))}

      {/* Modal de Banimento */}
      {banModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
            <h3 className="text-lg font-bold text-stone-900 mb-4">
              {users?.find(u => u.id === banModal.userId)?.ativo ? "Banir Usuário" : "Desbanir Usuário"}
            </h3>
            <p className="text-sm text-stone-600 mb-4">
              {users?.find(u => u.id === banModal.userId)?.ativo
                ? `Você está prestes a banir ${banModal.userName}. Esta ação impedirá que o usuário acesse o sistema.`
                : `Você está prestes a desbanir ${banModal.userName}. Esta ação permitirá que o usuário acesse o sistema novamente.`}
            </p>
            {users?.find(u => u.id === banModal.userId)?.ativo && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-stone-700 mb-2">Motivo do banimento</label>
                <textarea
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm"
                  rows={3}
                  placeholder="Descreva o motivo do banimento..."
                />
              </div>
            )}
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setBanModal(null); setBanReason(""); }}
                className="rounded-xl px-4 py-2 text-sm font-semibold text-stone-600 hover:bg-stone-100"
              >
                Cancelar
              </button>
              <button
                onClick={handleBan}
                className="rounded-xl px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700"
              >
                {users?.find(u => u.id === banModal.userId)?.ativo ? "Banir" : "Desbanir"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Contato */}
      {contactModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
            <h3 className="text-lg font-bold text-stone-900 mb-4">Entrar em Contato</h3>
            <p className="text-sm text-stone-600 mb-4">
              Enviar mensagem para {contactModal.userName}
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-stone-700 mb-2">Título</label>
              <input
                type="text"
                value={contactTitle}
                onChange={(e) => setContactTitle(e.target.value)}
                className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm"
                placeholder="Título da mensagem..."
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-stone-700 mb-2">Mensagem</label>
              <textarea
                value={contactMessage}
                onChange={(e) => setContactMessage(e.target.value)}
                className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm"
                rows={4}
                placeholder="Sua mensagem..."
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setContactModal(null); setContactTitle(""); setContactMessage(""); }}
                className="rounded-xl px-4 py-2 text-sm font-semibold text-stone-600 hover:bg-stone-100"
              >
                Cancelar
              </button>
              <button
                onClick={handleContact}
                className="rounded-xl px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700"
              >
                Enviar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Skeleton } from "@/components/Skeleton";
import { useSettings } from "@/lib/settings-context";
import { useToast } from "@/components/Toast";
import { useAuth } from "@/lib/auth-context";
import type { PublicProfile, Role } from "@/lib/types";

const ROLES: Role[] = ["citizen", "moderator", "admin"];

interface AdminUser extends PublicProfile {
  email: string;
}

export function UsersTab() {
  const { t } = useSettings();
  const { show } = useToast();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<AdminUser[] | null>(null);

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
        <div key={u.id} className="card-surface flex flex-wrap items-center justify-between gap-3 rounded-2xl p-4 shadow-sm">
          <div>
            <p className="font-semibold text-stone-900">{u.nome}</p>
            <p className="text-xs text-stone-500">{u.email}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-brand-700">{u.pontosTotais} pts</span>
            <select
              value={u.role}
              disabled={u.id === currentUser?.id}
              onChange={(e) => changeRole(u.id, e.target.value as Role)}
              className="rounded-xl border border-stone-300 px-3 py-1.5 text-sm disabled:opacity-50"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        </div>
      ))}
    </div>
  );
}

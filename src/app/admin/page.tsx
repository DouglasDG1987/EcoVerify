"use client";

import { useState } from "react";
import { RequireAuth } from "@/components/RequireAuth";
import { AppShell } from "@/components/AppShell";
import { useSettings } from "@/lib/settings-context";
import { cn } from "@/lib/utils";
import { MetricsTab } from "@/components/admin/MetricsTab";
import { MissionsTab } from "@/components/admin/MissionsTab";
import { UsersTab } from "@/components/admin/UsersTab";
import { RewardsTab } from "@/components/admin/RewardsTab";

type Tab = "metrics" | "missions" | "users" | "rewards";

export default function AdminPage() {
  return (
    <RequireAuth roles={["admin"]}>
      <AppShell>
        <AdminContent />
      </AppShell>
    </RequireAuth>
  );
}

function AdminContent() {
  const { t } = useSettings();
  const [tab, setTab] = useState<Tab>("metrics");

  const tabs: { key: Tab; label: string }[] = [
    { key: "metrics", label: t("admin.tabs.metrics") },
    { key: "missions", label: t("admin.tabs.missions") },
    { key: "users", label: t("admin.tabs.users") },
    { key: "rewards", label: t("admin.tabs.rewards") },
  ];

  return (
    <div className="animate-fade-in">
      <h1 className="mb-6 text-2xl font-extrabold text-stone-900">{t("admin.title")}</h1>

      <div className="mb-6 flex gap-2 overflow-x-auto rounded-2xl bg-stone-100 p-1.5">
        {tabs.map((tItem) => (
          <button
            key={tItem.key}
            onClick={() => setTab(tItem.key)}
            className={cn(
              "shrink-0 rounded-xl px-4 py-2 text-sm font-semibold transition-colors",
              tab === tItem.key ? "bg-white text-brand-700 shadow-sm" : "text-stone-500 hover:text-stone-700",
            )}
          >
            {tItem.label}
          </button>
        ))}
      </div>

      {tab === "metrics" && <MetricsTab />}
      {tab === "missions" && <MissionsTab />}
      {tab === "users" && <UsersTab />}
      {tab === "rewards" && <RewardsTab />}
    </div>
  );
}

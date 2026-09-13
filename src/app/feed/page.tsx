"use client";

import { useEffect, useState } from "react";
import { RequireAuth } from "@/components/RequireAuth";
import { AppShell } from "@/components/AppShell";
import { MissionCard } from "@/components/MissionCard";
import { SubmissionModal } from "@/components/SubmissionModal";
import { Skeleton } from "@/components/Skeleton";
import { useSettings } from "@/lib/settings-context";
import type { Mission } from "@/lib/types";

export default function FeedPage() {
  return (
    <RequireAuth>
      <AppShell>
        <FeedContent />
      </AppShell>
    </RequireAuth>
  );
}

function FeedContent() {
  const { t } = useSettings();
  const [missions, setMissions] = useState<Mission[] | null>(null);
  const [selected, setSelected] = useState<Mission | null>(null);

  const loadMissions = () => {
    fetch("/api/missions")
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) setMissions(data.missions);
      })
      .catch(() => setMissions([]));
  };

  useEffect(() => {
    loadMissions();
  }, []);

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-stone-900">{t("feed.title")}</h1>
        <p className="text-sm text-stone-500">{t("feed.subtitle")}</p>
      </div>

      {missions === null && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-56 w-full" />
          ))}
        </div>
      )}

      {missions?.length === 0 && (
        <p className="rounded-2xl bg-white p-8 text-center text-stone-500 shadow-sm">{t("feed.empty")}</p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {missions?.map((mission) => (
          <MissionCard key={mission.id} mission={mission} onSelect={setSelected} />
        ))}
      </div>

      {selected && (
        <SubmissionModal
          mission={selected}
          onClose={() => setSelected(null)}
          onSuccess={() => {
            setSelected(null);
          }}
        />
      )}
    </div>
  );
}

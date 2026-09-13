"use client";

import { useEffect, useState } from "react";
import { Plus, Save } from "lucide-react";
import { Skeleton } from "@/components/Skeleton";
import { useSettings } from "@/lib/settings-context";
import { useToast } from "@/components/Toast";
import { MISSION_CATEGORY_EMOJI } from "@/lib/utils";
import type { Mission, MissionCategoria } from "@/lib/types";

const CATEGORIES: MissionCategoria[] = ["plantio", "doacao", "reciclagem", "mutirao", "outro"];

const EMPTY_FORM = {
  titulo: "",
  descricao: "",
  categoria: "plantio" as MissionCategoria,
  pontosRecompensa: 50,
  foneRecompensaEstimado: 2,
};

export function MissionsTab() {
  const { t } = useSettings();
  const { show } = useToast();
  const [missions, setMissions] = useState<Mission[] | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [creating, setCreating] = useState(false);

  const load = () => {
    fetch("/api/missions?all=1")
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) setMissions(data.missions);
      })
      .catch(() => setMissions([]));
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async () => {
    if (!form.titulo.trim() || !form.descricao.trim()) {
      show("Preencha título e descrição.", "error");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/missions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        show(data.error ?? t("auth.errorGeneric"), "error");
        return;
      }
      show("Missão criada.", "success");
      setForm(EMPTY_FORM);
      load();
    } catch {
      show(t("auth.errorGeneric"), "error");
    } finally {
      setCreating(false);
    }
  };

  const toggleActive = async (mission: Mission) => {
    try {
      const res = await fetch(`/api/missions/${mission.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ativa: !mission.ativa }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        show(data.error ?? t("auth.errorGeneric"), "error");
        return;
      }
      load();
    } catch {
      show(t("auth.errorGeneric"), "error");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="card-surface rounded-2xl p-5 shadow-sm">
        <h3 className="mb-4 flex items-center gap-2 font-semibold text-stone-900">
          <Plus className="h-4 w-4" /> {t("admin.missions.new")}
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input
            placeholder={t("admin.missions.title")}
            value={form.titulo}
            onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))}
            className="rounded-xl border border-stone-300 px-3 py-2 text-sm sm:col-span-2"
          />
          <textarea
            placeholder={t("admin.missions.description")}
            value={form.descricao}
            onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
            rows={2}
            className="rounded-xl border border-stone-300 px-3 py-2 text-sm sm:col-span-2"
          />
          <select
            value={form.categoria}
            onChange={(e) => setForm((f) => ({ ...f, categoria: e.target.value as MissionCategoria }))}
            className="rounded-xl border border-stone-300 px-3 py-2 text-sm"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {MISSION_CATEGORY_EMOJI[c]} {c}
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <input
              type="number"
              min={0}
              placeholder={t("admin.missions.points")}
              value={form.pontosRecompensa}
              onChange={(e) => setForm((f) => ({ ...f, pontosRecompensa: Number(e.target.value) }))}
              className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm"
            />
            <input
              type="number"
              min={0}
              step="0.0001"
              placeholder={t("admin.missions.fone")}
              value={form.foneRecompensaEstimado}
              onChange={(e) => setForm((f) => ({ ...f, foneRecompensaEstimado: Number(e.target.value) }))}
              className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm"
            />
          </div>
        </div>
        <button
          onClick={handleCreate}
          disabled={creating}
          className="mt-4 flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
        >
          <Save className="h-4 w-4" /> {t("admin.missions.save")}
        </button>
      </div>

      {missions === null && (
        <div className="flex flex-col gap-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      )}

      <div className="flex flex-col gap-3">
        {missions?.map((mission) => (
          <div key={mission.id} className="card-surface flex items-center justify-between rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="text-xl">{MISSION_CATEGORY_EMOJI[mission.categoria]}</span>
              <div>
                <p className="font-semibold text-stone-900">{mission.titulo}</p>
                <p className="text-xs text-stone-500">
                  {mission.pontosRecompensa} pts · {mission.foneRecompensaEstimado} FONE
                </p>
              </div>
            </div>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <span className={mission.ativa ? "text-brand-700" : "text-stone-400"}>
                {t("admin.missions.active")}
              </span>
              <input type="checkbox" checked={mission.ativa} onChange={() => toggleActive(mission)} className="h-4 w-4 accent-brand-600" />
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}

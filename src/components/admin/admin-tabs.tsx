"use client";

import { useState, type ReactNode } from "react";

export function AdminTabs({
  tabs,
}: {
  tabs: { key: string; label: string; icon: string; content: ReactNode }[];
}) {
  const [active, setActive] = useState(tabs[0]?.key);

  return (
    <div>
      <div className="flex gap-2 overflow-x-auto rounded-2xl bg-slate-100 p-1.5">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActive(tab.key)}
            className={`flex shrink-0 items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
              active === tab.key ? "bg-white text-emerald-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>
      <div className="mt-6">
        {tabs.map((tab) => (
          <div key={tab.key} className={tab.key === active ? "block animate-fade-in" : "hidden"}>
            {tab.content}
          </div>
        ))}
      </div>
    </div>
  );
}

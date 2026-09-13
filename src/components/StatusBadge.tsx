"use client";

import { cn } from "@/lib/utils";
import type { SubmissionStatus } from "@/lib/types";
import { useSettings } from "@/lib/settings-context";

export function StatusBadge({ status }: { status: SubmissionStatus }) {
  const { t } = useSettings();
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
        status === "pendente" && "bg-amber-100 text-amber-800",
        status === "aprovada" && "bg-brand-100 text-brand-800",
        status === "rejeitada" && "bg-red-100 text-red-800",
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          status === "pendente" && "bg-amber-500",
          status === "aprovada" && "bg-brand-500",
          status === "rejeitada" && "bg-red-500",
        )}
      />
      {t(`status.${status}`)}
    </span>
  );
}

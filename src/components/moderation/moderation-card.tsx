"use client";

import { useActionState } from "react";
import { approveSubmissionAction, type ModerationActionState } from "@/lib/actions/moderation";
import { categoryEmoji, categoryLabels, t, type Lang } from "@/lib/i18n";
import { formatDate } from "@/lib/utils";
import { RejectModal } from "@/components/moderation/reject-modal";
import { HistoryPanel } from "@/components/moderation/history-panel";

const initialState: ModerationActionState = {};

export function ModerationCard({
  lang,
  moderatorId,
  submission,
}: {
  lang: Lang;
  moderatorId: string;
  submission: {
    id: string;
    photoUrl: string;
    report: string;
    latitude: string | null;
    longitude: string | null;
    submittedAt: Date;
    missionTitle: string;
    missionCategory: string;
    authorId: string;
    authorName: string;
  };
}) {
  const [state, formAction, pending] = useActionState(approveSubmissionAction, initialState);
  const isOwn = submission.authorId === moderatorId;

  if (state.success) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-emerald-700 animate-fade-in">
        <span className="text-2xl">✅</span>
        <p className="font-semibold">Comprovação aprovada com sucesso!</p>
      </div>
    );
  }

  return (
    <div className="card-surface overflow-hidden rounded-2xl border border-black/5 bg-white shadow-[0_10px_30px_rgba(16,24,40,0.06)] animate-slide-up md:flex">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={submission.photoUrl} alt={submission.missionTitle} className="h-56 w-full object-cover md:h-auto md:w-64" />
      <div className="flex-1 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xl">{categoryEmoji[submission.missionCategory] ?? "🌱"}</span>
          <h3 className="font-bold text-slate-900">{submission.missionTitle}</h3>
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-500">
            {categoryLabels[submission.missionCategory]?.[lang]}
          </span>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-500">
          <span>por</span>
          <HistoryPanel lang={lang} userId={submission.authorId} userName={submission.authorName} />
          <span>·</span>
          <span>{formatDate(submission.submittedAt, lang)}</span>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-slate-700">{submission.report}</p>
        {submission.latitude && submission.longitude && (
          <p className="mt-2 flex items-center gap-1 text-xs text-slate-400">
            📍 {Number(submission.latitude).toFixed(4)}, {Number(submission.longitude).toFixed(4)}
          </p>
        )}

        <div className="mt-5">
          {isOwn ? (
            <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
              {t(lang, "own_submission_warning")}
            </p>
          ) : (
            <div className="flex gap-3">
              <form action={formAction} className="flex-1">
                <input type="hidden" name="submissionId" value={submission.id} />
                <button
                  type="submit"
                  disabled={pending}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-70"
                >
                  {pending && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
                  ✓ {t(lang, "approve")}
                </button>
              </form>
              <RejectModal lang={lang} submissionId={submission.id} onDone={() => {}} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

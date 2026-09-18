import { eq, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { submissions } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { initials, formatDate, levelForPoints } from "@/lib/utils";
import { t } from "@/lib/i18n";
import { WalletEditor } from "@/components/profile/wallet-editor";
import { logoutAction } from "@/lib/actions/auth";

const roleLabels: Record<string, string> = {
  citizen: "Cidadão(ã)",
  moderator: "Moderador(a)",
  admin: "Administrador(a)",
};

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [approved] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(submissions)
    .where(sql`${submissions.userId} = ${user.id} and ${submissions.status} = 'approved'`);
  const [pending] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(submissions)
    .where(sql`${submissions.userId} = ${user.id} and ${submissions.status} = 'pending'`);
  const [rejected] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(submissions)
    .where(sql`${submissions.userId} = ${user.id} and ${submissions.status} = 'rejected'`);

  const level = levelForPoints(user.totalPoints, user.language);

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">{t(user.language, "profile_title")}</h1>

      <div className="mt-6 rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
        <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
          <div className="grid h-20 w-20 shrink-0 place-items-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-2xl font-bold text-white shadow-md">
            {initials(user.name)}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-slate-900">{user.name}</h2>
            <p className="text-sm text-slate-500">{user.email}</p>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                {level.emoji} {level.name}
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                {roleLabels[user.role]}
              </span>
            </div>
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 px-6 py-4 text-center">
            <p className="text-3xl font-extrabold text-emerald-700">{user.totalPoints}</p>
            <p className="text-xs font-medium text-slate-500">{t(user.language, "points")}</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-emerald-50 p-3 text-center">
            <p className="text-lg font-extrabold text-emerald-700">{approved.count}</p>
            <p className="text-xs font-medium text-emerald-600">{t(user.language, "status_approved")}</p>
          </div>
          <div className="rounded-xl bg-amber-50 p-3 text-center">
            <p className="text-lg font-extrabold text-amber-700">{pending.count}</p>
            <p className="text-xs font-medium text-amber-600">{t(user.language, "status_pending")}</p>
          </div>
          <div className="rounded-xl bg-red-50 p-3 text-center">
            <p className="text-lg font-extrabold text-red-700">{rejected.count}</p>
            <p className="text-xs font-medium text-red-600">{t(user.language, "status_rejected")}</p>
          </div>
        </div>

        <div className="mt-6 border-t border-slate-100 pt-5">
          <p className="mb-2 text-sm font-semibold text-slate-700">🪙 Carteira FONE</p>
          <WalletEditor walletAddress={user.walletAddress} />
        </div>

        <div className="mt-5 border-t border-slate-100 pt-5 text-sm text-slate-500">
          Na plataforma desde {formatDate(user.createdAt, user.language)}
        </div>

        <form action={logoutAction} className="mt-6">
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 hover:border-red-200 hover:bg-red-50 hover:text-red-600 sm:w-auto"
          >
            🚪 {t(user.language, "nav_logout")}
          </button>
        </form>
      </div>
    </div>
  );
}

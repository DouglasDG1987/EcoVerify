import { desc, eq, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { missions, pointsLedger, rewardQueue, submissions, users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { AdminTabs } from "@/components/admin/admin-tabs";
import { MetricsTab } from "@/components/admin/metrics-tab";
import { MissionsTab } from "@/components/admin/missions-tab";
import { UsersTab } from "@/components/admin/users-tab";
import { RewardsTab } from "@/components/admin/rewards-tab";

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/missions");

  const [pendingCount] = await db.select({ count: sql<number>`count(*)::int` }).from(submissions).where(eq(submissions.status, "pending"));
  const [approvedCount] = await db.select({ count: sql<number>`count(*)::int` }).from(submissions).where(eq(submissions.status, "approved"));
  const [rejectedCount] = await db.select({ count: sql<number>`count(*)::int` }).from(submissions).where(eq(submissions.status, "rejected"));
  const [pointsSum] = await db.select({ sum: sql<number>`coalesce(sum(${pointsLedger.points}), 0)::int` }).from(pointsLedger);
  const [usersCount] = await db.select({ count: sql<number>`count(*)::int` }).from(users);
  const [foneQueuedSum] = await db
    .select({ sum: sql<string>`coalesce(sum(${rewardQueue.foneAmount}), 0)::text` })
    .from(rewardQueue)
    .where(sql`${rewardQueue.status} in ('pending', 'processing')`);
  const [fonePaidSum] = await db
    .select({ sum: sql<string>`coalesce(sum(${rewardQueue.foneAmount}), 0)::text` })
    .from(rewardQueue)
    .where(eq(rewardQueue.status, "paid"));

  const approvalRate = approvedCount.count + rejectedCount.count > 0
    ? Math.round((approvedCount.count / (approvedCount.count + rejectedCount.count)) * 100)
    : 0;

  const topRanking = await db
    .select({ id: users.id, name: users.name, totalPoints: users.totalPoints })
    .from(users)
    .orderBy(desc(users.totalPoints))
    .limit(5);

  const allMissions = await db.select().from(missions).orderBy(desc(missions.createdAt));

  const allUsers = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      totalPoints: users.totalPoints,
      createdAt: users.createdAt,
      isBanned: users.isBanned,
      banReason: users.banReason,
    })
    .from(users)
    .orderBy(desc(users.totalPoints));

  const rewardsRaw = await db
    .select({
      id: rewardQueue.id,
      foneAmount: rewardQueue.foneAmount,
      status: rewardQueue.status,
      network: rewardQueue.network,
      txHash: rewardQueue.txHash,
      userName: users.name,
      createdAt: rewardQueue.createdAt,
    })
    .from(rewardQueue)
    .innerJoin(users, eq(rewardQueue.userId, users.id))
    .orderBy(desc(rewardQueue.createdAt));

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">📊 Painel Administrativo</h1>
      <p className="mt-1 text-sm text-slate-500">Métricas, missões, usuários e recompensas da plataforma.</p>

      <div className="mt-6">
        <AdminTabs
          tabs={[
            {
              key: "metrics",
              label: "Métricas",
              icon: "📈",
              content: (
                <MetricsTab
                  metrics={{
                    pending: pendingCount.count,
                    approved: approvedCount.count,
                    rejected: rejectedCount.count,
                    approvalRate,
                    pointsDistributed: pointsSum.sum,
                    totalUsers: usersCount.count,
                    foneQueued: foneQueuedSum.sum,
                    fonePaid: fonePaidSum.sum,
                  }}
                  topRanking={topRanking}
                />
              ),
            },
            { key: "missions", label: "Missões", icon: "🌱", content: <MissionsTab missions={allMissions} /> },
            { key: "users", label: "Usuários", icon: "👥", content: <UsersTab users={allUsers} currentUserId={user.id} /> },
            { key: "rewards", label: "Recompensas", icon: "🪙", content: <RewardsTab rewards={rewardsRaw} /> },
          ]}
        />
      </div>
    </div>
  );
}

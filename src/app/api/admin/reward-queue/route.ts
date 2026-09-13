import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { profiles, rewardQueue } from "@/db/schema";
import { requireRole } from "@/lib/auth";
import { jsonError } from "@/lib/api-utils";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireRole(["admin"]);

    const rows = await db
      .select({
        id: rewardQueue.id,
        userId: rewardQueue.userId,
        submissionId: rewardQueue.submissionId,
        valorFone: rewardQueue.valorFone,
        status: rewardQueue.status,
        txHash: rewardQueue.txHash,
        rede: rewardQueue.rede,
        createdAt: rewardQueue.createdAt,
        updatedAt: rewardQueue.updatedAt,
        usuarioNome: profiles.nome,
      })
      .from(rewardQueue)
      .innerJoin(profiles, eq(rewardQueue.userId, profiles.id))
      .orderBy(desc(rewardQueue.createdAt));

    return Response.json({
      ok: true,
      rewardQueue: rows.map((r) => ({
        ...r,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      })),
    });
  } catch (err) {
    return jsonError(err);
  }
}

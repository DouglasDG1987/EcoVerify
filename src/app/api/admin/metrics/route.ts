import { sql, eq, count, sum } from "drizzle-orm";
import { db } from "@/db";
import { pointsLedger, profiles, rewardQueue, submissions } from "@/db/schema";
import { requireRole } from "@/lib/auth";
import { jsonError } from "@/lib/api-utils";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireRole(["admin"]);

    const [pendentesRow] = await db
      .select({ n: count() })
      .from(submissions)
      .where(eq(submissions.status, "pendente"));
    const [aprovadasRow] = await db
      .select({ n: count() })
      .from(submissions)
      .where(eq(submissions.status, "aprovada"));
    const [rejeitadasRow] = await db
      .select({ n: count() })
      .from(submissions)
      .where(eq(submissions.status, "rejeitada"));
    const [usuariosRow] = await db.select({ n: count() }).from(profiles);
    const [pontosRow] = await db
      .select({ total: sum(pointsLedger.pontos) })
      .from(pointsLedger);

    const [foneParadoRow] = await db
      .select({ total: sum(rewardQueue.valorFone) })
      .from(rewardQueue)
      .where(eq(rewardQueue.status, "pendente"));
    const [fonePagoRow] = await db
      .select({ total: sum(rewardQueue.valorFone) })
      .from(rewardQueue)
      .where(eq(rewardQueue.status, "pago"));

    const rankingResult = await db.execute<{
      id: string;
      nome: string;
      pontos_totais: number;
      [key: string]: unknown;
    }>(sql`select id, nome, pontos_totais from get_leaderboard(5)`);

    const pendentes = Number(pendentesRow?.n ?? 0);
    const aprovadas = Number(aprovadasRow?.n ?? 0);
    const rejeitadas = Number(rejeitadasRow?.n ?? 0);
    const totalRevisadas = aprovadas + rejeitadas;
    const taxaAprovacao = totalRevisadas > 0 ? aprovadas / totalRevisadas : 0;

    return Response.json({
      ok: true,
      metrics: {
        pendentes,
        aprovadas,
        rejeitadas,
        taxaAprovacao,
        pontosDistribuidos: Number(pontosRow?.total ?? 0),
        totalUsuarios: Number(usuariosRow?.n ?? 0),
        foneParado: Number(foneParadoRow?.total ?? 0),
        fonePago: Number(fonePagoRow?.total ?? 0),
        ranking: rankingResult.rows.map((r) => ({
          id: r.id,
          nome: r.nome,
          pontosTotais: r.pontos_totais,
        })),
      },
    });
  } catch (err) {
    return jsonError(err);
  }
}

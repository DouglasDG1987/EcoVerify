import { sql } from "drizzle-orm";
import { db } from "@/db";
import { requireUser } from "@/lib/auth";
import { jsonError } from "@/lib/api-utils";

export const dynamic = "force-dynamic";

interface LeaderboardRow {
  id: string;
  nome: string;
  pontos_totais: number;
  [key: string]: unknown;
}

export async function GET(request: Request) {
  try {
    await requireUser();
    const url = new URL(request.url);
    const limitParam = Number(url.searchParams.get("limit") ?? "20");
    const limit = Number.isFinite(limitParam) ? limitParam : 20;

    // get_leaderboard() já sanitiza o LIMIT (LEAST/GREATEST) e nunca expõe
    // email/wallet_address — ver src/db/sql/001_functions.sql.
    const result = await db.execute<LeaderboardRow>(
      sql`select id, nome, pontos_totais from get_leaderboard(${limit})`,
    );

    return Response.json({
      ok: true,
      leaderboard: result.rows.map((r) => ({
        id: r.id,
        nome: r.nome,
        pontosTotais: r.pontos_totais,
      })),
    });
  } catch (err) {
    return jsonError(err);
  }
}

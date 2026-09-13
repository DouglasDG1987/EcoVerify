import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { missions, submissions } from "@/db/schema";
import { requireRole } from "@/lib/auth";
import { jsonError } from "@/lib/api-utils";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    await requireRole(["moderator", "admin"]);
    const { userId } = await params;

    const rows = await db
      .select({
        id: submissions.id,
        status: submissions.status,
        relatorioTexto: submissions.relatorioTexto,
        motivoRejeicao: submissions.motivoRejeicao,
        createdAt: submissions.createdAt,
        reviewedAt: submissions.reviewedAt,
        missionTitulo: missions.titulo,
        missionCategoria: missions.categoria,
      })
      .from(submissions)
      .innerJoin(missions, eq(submissions.missionId, missions.id))
      .where(eq(submissions.userId, userId))
      .orderBy(desc(submissions.createdAt));

    return Response.json({
      ok: true,
      submissions: rows.map((r) => ({
        id: r.id,
        status: r.status,
        relatorioTexto: r.relatorioTexto,
        motivoRejeicao: r.motivoRejeicao,
        createdAt: r.createdAt.toISOString(),
        reviewedAt: r.reviewedAt ? r.reviewedAt.toISOString() : null,
        missionTitulo: r.missionTitulo,
        missionCategoria: r.missionCategoria,
      })),
    });
  } catch (err) {
    return jsonError(err);
  }
}

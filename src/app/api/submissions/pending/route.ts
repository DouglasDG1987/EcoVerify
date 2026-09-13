import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { missions, profiles, submissions } from "@/db/schema";
import { requireRole } from "@/lib/auth";
import { jsonError } from "@/lib/api-utils";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireRole(["moderator", "admin"]);

    const rows = await db
      .select({
        id: submissions.id,
        userId: submissions.userId,
        missionId: submissions.missionId,
        fotoUrl: submissions.fotoUrl,
        relatorioTexto: submissions.relatorioTexto,
        lat: submissions.lat,
        lng: submissions.lng,
        status: submissions.status,
        createdAt: submissions.createdAt,
        autorNome: profiles.nome,
        missionTitulo: missions.titulo,
        missionCategoria: missions.categoria,
        missionPontos: missions.pontosRecompensa,
        missionFone: missions.foneRecompensaEstimado,
      })
      .from(submissions)
      .innerJoin(missions, eq(submissions.missionId, missions.id))
      .innerJoin(profiles, eq(submissions.userId, profiles.id))
      .where(eq(submissions.status, "pendente"))
      .orderBy(asc(submissions.createdAt));

    return Response.json({
      ok: true,
      submissions: rows.map((r) => ({
        id: r.id,
        userId: r.userId,
        missionId: r.missionId,
        fotoUrl: r.fotoUrl,
        relatorioTexto: r.relatorioTexto,
        lat: r.lat,
        lng: r.lng,
        status: r.status,
        createdAt: r.createdAt.toISOString(),
        autor: { id: r.userId, nome: r.autorNome },
        mission: {
          id: r.missionId,
          titulo: r.missionTitulo,
          categoria: r.missionCategoria,
          pontosRecompensa: r.missionPontos,
          foneRecompensaEstimado: r.missionFone,
        },
      })),
    });
  } catch (err) {
    return jsonError(err);
  }
}

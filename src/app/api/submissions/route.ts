import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { missions, submissions } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { jsonError } from "@/lib/api-utils";
import { MIN_REPORT_LEN, MAX_REPORT_LEN } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requireUser();

    const rows = await db
      .select({
        id: submissions.id,
        userId: submissions.userId,
        missionId: submissions.missionId,
        fotoUrl: submissions.fotoUrl,
        fotoHash: submissions.fotoHash,
        relatorioTexto: submissions.relatorioTexto,
        lat: submissions.lat,
        lng: submissions.lng,
        status: submissions.status,
        moderadorId: submissions.moderadorId,
        motivoRejeicao: submissions.motivoRejeicao,
        createdAt: submissions.createdAt,
        reviewedAt: submissions.reviewedAt,
        missionTitulo: missions.titulo,
        missionCategoria: missions.categoria,
        missionPontos: missions.pontosRecompensa,
        missionFone: missions.foneRecompensaEstimado,
      })
      .from(submissions)
      .innerJoin(missions, eq(submissions.missionId, missions.id))
      .where(eq(submissions.userId, user.id))
      .orderBy(desc(submissions.createdAt));

    return Response.json({
      ok: true,
      submissions: rows.map((r) => ({
        id: r.id,
        userId: r.userId,
        missionId: r.missionId,
        fotoUrl: r.fotoUrl,
        fotoHash: r.fotoHash,
        relatorioTexto: r.relatorioTexto,
        lat: r.lat,
        lng: r.lng,
        status: r.status,
        moderadorId: r.moderadorId,
        motivoRejeicao: r.motivoRejeicao,
        createdAt: r.createdAt.toISOString(),
        reviewedAt: r.reviewedAt ? r.reviewedAt.toISOString() : null,
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

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();

    const missionId = typeof body.missionId === "string" ? body.missionId : "";
    const fotoUrl = typeof body.fotoUrl === "string" ? body.fotoUrl : "";
    const fotoHash = typeof body.fotoHash === "string" ? body.fotoHash : "";
    const relatorioTexto = typeof body.relatorioTexto === "string" ? body.relatorioTexto.trim() : "";
    const lat = typeof body.lat === "number" ? body.lat : null;
    const lng = typeof body.lng === "number" ? body.lng : null;

    if (!missionId || !fotoUrl || !fotoHash) {
      return Response.json({ ok: false, error: "Envie a foto da ação para a missão selecionada." }, { status: 400 });
    }
    if (relatorioTexto.length < MIN_REPORT_LEN) {
      return Response.json(
        { ok: false, error: `O relatório precisa ter ao menos ${MIN_REPORT_LEN} caracteres.` },
        { status: 400 },
      );
    }
    if (relatorioTexto.length > MAX_REPORT_LEN) {
      return Response.json(
        { ok: false, error: `O relatório pode ter no máximo ${MAX_REPORT_LEN} caracteres.` },
        { status: 400 },
      );
    }

    const [mission] = await db.select().from(missions).where(eq(missions.id, missionId)).limit(1);
    if (!mission || !mission.ativa) {
      return Response.json({ ok: false, error: "Missão inválida ou inativa." }, { status: 400 });
    }

    const [created] = await db
      .insert(submissions)
      .values({
        userId: user.id,
        missionId,
        fotoUrl,
        fotoHash,
        relatorioTexto,
        lat,
        lng,
      })
      .returning();

    return Response.json({
      ok: true,
      submission: {
        ...created,
        createdAt: created.createdAt.toISOString(),
        reviewedAt: created.reviewedAt ? created.reviewedAt.toISOString() : null,
      },
    });
  } catch (err) {
    return jsonError(err);
  }
}

import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { missions } from "@/db/schema";
import { requireUser, requireRole } from "@/lib/auth";
import { jsonError } from "@/lib/api-utils";

export const dynamic = "force-dynamic";

const CATEGORIES = ["plantio", "doacao", "reciclagem", "mutirao", "outro"] as const;

export async function GET(request: Request) {
  try {
    await requireUser();
    const url = new URL(request.url);
    const includeInactive = url.searchParams.get("all") === "1";

    const rows = includeInactive
      ? await db.select().from(missions).orderBy(desc(missions.createdAt))
      : await db
          .select()
          .from(missions)
          .where(eq(missions.ativa, true))
          .orderBy(desc(missions.createdAt));

    return Response.json({
      ok: true,
      missions: rows.map((m) => ({
        ...m,
        createdAt: m.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    return jsonError(err);
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireRole(["admin"]);
    const body = await request.json();

    const titulo = typeof body.titulo === "string" ? body.titulo.trim() : "";
    const descricao = typeof body.descricao === "string" ? body.descricao.trim() : "";
    const categoria = body.categoria;
    const pontosRecompensa = Number(body.pontosRecompensa);
    const foneRecompensaEstimado = Number(body.foneRecompensaEstimado);

    if (!titulo || !descricao) {
      return Response.json({ ok: false, error: "Título e descrição são obrigatórios." }, { status: 400 });
    }
    if (!CATEGORIES.includes(categoria)) {
      return Response.json({ ok: false, error: "Categoria inválida." }, { status: 400 });
    }
    if (!Number.isFinite(pontosRecompensa) || pontosRecompensa < 0) {
      return Response.json({ ok: false, error: "Pontos de recompensa inválidos." }, { status: 400 });
    }
    if (!Number.isFinite(foneRecompensaEstimado) || foneRecompensaEstimado < 0) {
      return Response.json({ ok: false, error: "Valor de FONE inválido." }, { status: 400 });
    }

    const [created] = await db
      .insert(missions)
      .values({
        titulo,
        descricao,
        categoria,
        pontosRecompensa: Math.round(pontosRecompensa),
        foneRecompensaEstimado: foneRecompensaEstimado.toFixed(4),
        ativa: body.ativa !== false,
        createdBy: admin.id,
      })
      .returning();

    return Response.json({ ok: true, mission: { ...created, createdAt: created.createdAt.toISOString() } });
  } catch (err) {
    return jsonError(err);
  }
}

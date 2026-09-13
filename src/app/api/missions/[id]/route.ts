import { eq } from "drizzle-orm";
import { db } from "@/db";
import { missions } from "@/db/schema";
import { requireRole } from "@/lib/auth";
import { jsonError } from "@/lib/api-utils";

const CATEGORIES = ["plantio", "doacao", "reciclagem", "mutirao", "outro"] as const;

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireRole(["admin"]);
    const { id } = await params;
    const body = await request.json();

    const patch: Partial<typeof missions.$inferInsert> = {};

    if (typeof body.titulo === "string" && body.titulo.trim()) patch.titulo = body.titulo.trim();
    if (typeof body.descricao === "string" && body.descricao.trim()) patch.descricao = body.descricao.trim();
    if (typeof body.categoria === "string" && CATEGORIES.includes(body.categoria as (typeof CATEGORIES)[number])) {
      patch.categoria = body.categoria;
    }
    if (body.pontosRecompensa !== undefined) {
      const n = Number(body.pontosRecompensa);
      if (!Number.isFinite(n) || n < 0) {
        return Response.json({ ok: false, error: "Pontos de recompensa inválidos." }, { status: 400 });
      }
      patch.pontosRecompensa = Math.round(n);
    }
    if (body.foneRecompensaEstimado !== undefined) {
      const n = Number(body.foneRecompensaEstimado);
      if (!Number.isFinite(n) || n < 0) {
        return Response.json({ ok: false, error: "Valor de FONE inválido." }, { status: 400 });
      }
      patch.foneRecompensaEstimado = n.toFixed(4);
    }
    if (typeof body.ativa === "boolean") patch.ativa = body.ativa;

    if (Object.keys(patch).length === 0) {
      return Response.json({ ok: false, error: "Nada para atualizar." }, { status: 400 });
    }

    const [updated] = await db
      .update(missions)
      .set(patch)
      .where(eq(missions.id, id))
      .returning();

    if (!updated) {
      return Response.json({ ok: false, error: "Missão não encontrada." }, { status: 404 });
    }

    return Response.json({ ok: true, mission: { ...updated, createdAt: updated.createdAt.toISOString() } });
  } catch (err) {
    return jsonError(err);
  }
}

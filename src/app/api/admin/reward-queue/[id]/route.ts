import { eq } from "drizzle-orm";
import { db } from "@/db";
import { rewardQueue } from "@/db/schema";
import { requireRole } from "@/lib/auth";
import { jsonError } from "@/lib/api-utils";

const STATUSES = ["pendente", "em_processamento", "pago", "falhou"] as const;
const NETWORKS = ["fone_nativo", "bep20_bsc"] as const;

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireRole(["admin"]);
    const { id } = await params;
    const body = await request.json();

    const patch: Partial<typeof rewardQueue.$inferInsert> = {};

    if (body.status !== undefined) {
      if (!STATUSES.includes(body.status)) {
        return Response.json({ ok: false, error: "Status inválido." }, { status: 400 });
      }
      patch.status = body.status;
    }
    if (body.txHash !== undefined) {
      patch.txHash = typeof body.txHash === "string" && body.txHash.trim() ? body.txHash.trim() : null;
    }
    if (body.rede !== undefined) {
      if (!NETWORKS.includes(body.rede)) {
        return Response.json({ ok: false, error: "Rede inválida." }, { status: 400 });
      }
      patch.rede = body.rede;
    }

    if (Object.keys(patch).length === 0) {
      return Response.json({ ok: false, error: "Nada para atualizar." }, { status: 400 });
    }

    const [updated] = await db
      .update(rewardQueue)
      .set(patch)
      .where(eq(rewardQueue.id, id))
      .returning();

    if (!updated) {
      return Response.json({ ok: false, error: "Registro não encontrado." }, { status: 404 });
    }

    return Response.json({
      ok: true,
      item: { ...updated, createdAt: updated.createdAt.toISOString(), updatedAt: updated.updatedAt.toISOString() },
    });
  } catch (err) {
    return jsonError(err);
  }
}

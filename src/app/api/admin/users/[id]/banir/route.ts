import { db } from "@/db";
import { profiles } from "@/db/schema";
import { requireRole } from "@/lib/auth";
import { jsonError } from "@/lib/api-utils";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(["admin"]);

    const { id } = await params;
    const body = await request.json();
    const { ativo, motivoBanimento } = body;

    if (typeof ativo !== "boolean") {
      return Response.json({ ok: false, error: "Campo 'ativo' é obrigatório" }, { status: 400 });
    }

    if (!ativo && !motivoBanimento) {
      return Response.json({ ok: false, error: "Motivo do banimento é obrigatório" }, { status: 400 });
    }

    const result = await db
      .update(profiles)
      .set({
        ativo,
        motivoBanimento: ativo ? null : motivoBanimento,
      })
      .where(eq(profiles.id, id))
      .returning();

    if (result.length === 0) {
      return Response.json({ ok: false, error: "Usuário não encontrado" }, { status: 404 });
    }

    return Response.json({ ok: true, user: result[0] });
  } catch (err) {
    return jsonError(err);
  }
}
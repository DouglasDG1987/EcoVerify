import { eq } from "drizzle-orm";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { requireRole } from "@/lib/auth";
import { jsonError } from "@/lib/api-utils";

const ROLES = ["citizen", "moderator", "admin"] as const;

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await requireRole(["admin"]);
    const { id } = await params;
    const body = await request.json();

    if (!ROLES.includes(body.role)) {
      return Response.json({ ok: false, error: "Papel inválido." }, { status: 400 });
    }

    if (id === admin.id && body.role !== "admin") {
      return Response.json(
        { ok: false, error: "Você não pode remover seu próprio papel de admin." },
        { status: 400 },
      );
    }

    // Checamos explicitamente se alguma linha foi de fato afetada — um UPDATE
    // com WHERE que não casa nenhuma linha não é erro, apenas retorna 0 linhas,
    // e isso não pode passar silenciosamente batido como sucesso.
    const [updated] = await db
      .update(profiles)
      .set({ role: body.role })
      .where(eq(profiles.id, id))
      .returning({
        id: profiles.id,
        nome: profiles.nome,
        email: profiles.email,
        role: profiles.role,
        pontosTotais: profiles.pontosTotais,
        walletAddress: profiles.walletAddress,
        createdAt: profiles.createdAt,
      });

    if (!updated) {
      return Response.json({ ok: false, error: "Usuário não encontrado." }, { status: 404 });
    }

    return Response.json({
      ok: true,
      user: { ...updated, createdAt: updated.createdAt.toISOString() },
    });
  } catch (err) {
    return jsonError(err);
  }
}

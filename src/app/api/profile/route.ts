import { eq } from "drizzle-orm";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { jsonError } from "@/lib/api-utils";

export async function PATCH(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();

    if (typeof body.walletAddress !== "string") {
      return Response.json({ ok: false, error: "Endereço de carteira inválido." }, { status: 400 });
    }

    const walletAddress = body.walletAddress.trim();
    if (walletAddress.length > 0 && walletAddress.length < 6) {
      return Response.json({ ok: false, error: "Endereço de carteira inválido." }, { status: 400 });
    }

    const [updated] = await db
      .update(profiles)
      .set({ walletAddress: walletAddress || null })
      .where(eq(profiles.id, user.id))
      .returning({
        id: profiles.id,
        nome: profiles.nome,
        email: profiles.email,
        role: profiles.role,
        pontosTotais: profiles.pontosTotais,
        walletAddress: profiles.walletAddress,
        createdAt: profiles.createdAt,
      });

    return Response.json({
      ok: true,
      user: { ...updated, createdAt: updated.createdAt.toISOString() },
    });
  } catch (err) {
    return jsonError(err);
  }
}

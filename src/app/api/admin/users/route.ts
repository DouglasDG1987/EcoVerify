import { desc } from "drizzle-orm";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { requireRole } from "@/lib/auth";
import { jsonError } from "@/lib/api-utils";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireRole(["admin"]);

    const rows = await db
      .select({
        id: profiles.id,
        nome: profiles.nome,
        email: profiles.email,
        role: profiles.role,
        pontosTotais: profiles.pontosTotais,
        walletAddress: profiles.walletAddress,
        ativo: profiles.ativo,
        motivoBanimento: profiles.motivoBanimento,
        createdAt: profiles.createdAt,
      })
      .from(profiles)
      .orderBy(desc(profiles.createdAt));

    return Response.json({
      ok: true,
      users: rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })),
    });
  } catch (err) {
    return jsonError(err);
  }
}

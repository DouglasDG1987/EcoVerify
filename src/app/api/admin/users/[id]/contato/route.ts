import { db } from "@/db";
import { notifications } from "@/db/schema";
import { requireRole } from "@/lib/auth";
import { jsonError } from "@/lib/api-utils";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(["admin"]);

    const { id } = await params;
    const body = await request.json();
    const { titulo, mensagem } = body;

    if (!titulo || !mensagem) {
      return Response.json({ ok: false, error: "Título e mensagem são obrigatórios" }, { status: 400 });
    }

    const result = await db
      .insert(notifications)
      .values({
        userId: id,
        tipo: "contato_admin",
        titulo,
        mensagem,
      })
      .returning();

    return Response.json({ ok: true, notification: result[0] });
  } catch (err) {
    return jsonError(err);
  }
}
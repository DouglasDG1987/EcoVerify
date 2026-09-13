import { eq } from "drizzle-orm";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { verifyPassword, createSession, setSessionCookie } from "@/lib/auth";
import { jsonError } from "@/lib/api-utils";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const senha = typeof body.senha === "string" ? body.senha : "";

    if (!email || !senha) {
      return Response.json(
        { ok: false, error: "E-mail ou senha incorretos." },
        { status: 401 },
      );
    }

    const [found] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.email, email))
      .limit(1);

    if (!found) {
      return Response.json(
        { ok: false, error: "E-mail ou senha incorretos." },
        { status: 401 },
      );
    }

    const valid = await verifyPassword(senha, found.passwordHash);
    if (!valid) {
      return Response.json(
        { ok: false, error: "E-mail ou senha incorretos." },
        { status: 401 },
      );
    }

    const token = await createSession(found.id);
    await setSessionCookie(token);

    return Response.json({
      ok: true,
      user: {
        id: found.id,
        nome: found.nome,
        email: found.email,
        role: found.role,
        pontosTotais: found.pontosTotais,
        walletAddress: found.walletAddress,
        createdAt: found.createdAt.toISOString(),
      },
    });
  } catch (err) {
    return jsonError(err);
  }
}

import { db } from "@/db";
import { profiles } from "@/db/schema";
import { hashPassword, createSession, setSessionCookie } from "@/lib/auth";
import { jsonError } from "@/lib/api-utils";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const nome = typeof body.nome === "string" ? body.nome.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const senha = typeof body.senha === "string" ? body.senha : "";

    if (!nome) {
      return Response.json({ ok: false, error: "Informe seu nome." }, { status: 400 });
    }
    if (!EMAIL_RE.test(email)) {
      return Response.json({ ok: false, error: "Informe um e-mail válido." }, { status: 400 });
    }
    if (senha.length < 6) {
      return Response.json(
        { ok: false, error: "A senha deve ter ao menos 6 caracteres." },
        { status: 400 },
      );
    }

    const passwordHash = await hashPassword(senha);

    const [created] = await db
      .insert(profiles)
      .values({ nome, email, passwordHash, role: "citizen" })
      .returning({
        id: profiles.id,
        nome: profiles.nome,
        email: profiles.email,
        role: profiles.role,
        pontosTotais: profiles.pontosTotais,
        walletAddress: profiles.walletAddress,
        createdAt: profiles.createdAt,
      });

    const token = await createSession(created.id);
    await setSessionCookie(token);

    return Response.json({
      ok: true,
      user: { ...created, createdAt: created.createdAt.toISOString() },
    });
  } catch (err) {
    const pgErr = err as { code?: string };
    if (pgErr?.code === "23505") {
      return Response.json(
        { ok: false, error: "Este e-mail já está cadastrado." },
        { status: 409 },
      );
    }
    return jsonError(err);
  }
}

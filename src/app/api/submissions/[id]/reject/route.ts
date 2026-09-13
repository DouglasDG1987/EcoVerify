import { sql } from "drizzle-orm";
import { db } from "@/db";
import { requireRole } from "@/lib/auth";
import { jsonError } from "@/lib/api-utils";

interface RpcResult {
  ok: boolean;
  error?: string;
  submission_id?: string;
}

interface RpcRow {
  reject_submission: RpcResult;
  [key: string]: unknown;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const moderator = await requireRole(["moderator", "admin"]);
    const { id } = await params;
    const body = await request.json();
    const motivo = typeof body.motivo === "string" ? body.motivo.trim() : "";

    if (motivo.length < 5) {
      return Response.json(
        { ok: false, error: "O motivo da rejeição deve ter ao menos 5 caracteres." },
        { status: 400 },
      );
    }

    const result = await db.execute<RpcRow>(
      sql`select reject_submission(${id}::uuid, ${moderator.id}::uuid, ${motivo}) as reject_submission`,
    );

    const payload = result.rows[0]?.reject_submission;

    if (!payload?.ok) {
      const message = payload?.error ?? "Não foi possível rejeitar a submissão.";
      const status =
        message.includes("forbidden") ? 403 : message.includes("not found") ? 404 : 409;
      return Response.json({ ok: false, error: translateRpcError(message) }, { status });
    }

    return Response.json({ ok: true, submissionId: payload.submission_id });
  } catch (err) {
    return jsonError(err);
  }
}

function translateRpcError(message: string): string {
  if (message.includes("cannot moderate your own submission")) {
    return "Você não pode moderar sua própria submissão.";
  }
  if (message.includes("not pending")) {
    return "Esta submissão já foi revisada por outro moderador.";
  }
  if (message.includes("not found")) {
    return "Submissão não encontrada.";
  }
  if (message.includes("motivo")) {
    return "O motivo da rejeição deve ter ao menos 5 caracteres.";
  }
  if (message.includes("forbidden")) {
    return "Você não tem permissão para moderar submissões.";
  }
  return message;
}

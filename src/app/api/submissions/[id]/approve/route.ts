import { sql } from "drizzle-orm";
import { db } from "@/db";
import { requireRole } from "@/lib/auth";
import { jsonError } from "@/lib/api-utils";

interface RpcResult {
  ok: boolean;
  error?: string;
  submission_id?: string;
  pontos_creditados?: number;
  fone_enfileirado?: string;
}

interface RpcRow {
  approve_submission: RpcResult;
  [key: string]: unknown;
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const moderator = await requireRole(["moderator", "admin"]);
    const { id } = await params;

    // A checagem de permissão e de auto-moderação é refeita dentro da função
    // do banco (approve_submission), não apenas aqui — ver src/db/sql/001_functions.sql.
    const result = await db.execute<RpcRow>(
      sql`select approve_submission(${id}::uuid, ${moderator.id}::uuid) as approve_submission`,
    );

    const payload = result.rows[0]?.approve_submission;

    if (!payload?.ok) {
      const message = payload?.error ?? "Não foi possível aprovar a submissão.";
      const status =
        message.includes("forbidden") ? 403 : message.includes("not found") ? 404 : 409;
      return Response.json({ ok: false, error: translateRpcError(message) }, { status });
    }

    return Response.json({
      ok: true,
      submissionId: payload.submission_id,
      pontosCreditados: payload.pontos_creditados,
      foneEnfileirado: payload.fone_enfileirado,
    });
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
  if (message.includes("forbidden")) {
    return "Você não tem permissão para moderar submissões.";
  }
  return message;
}

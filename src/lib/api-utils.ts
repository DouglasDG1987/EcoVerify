import { HttpError } from "@/lib/auth";

/** Interface de erros do driver `pg` para checagem segura de propriedades. */
interface PgError {
  code?: string;
  constraint?: string;
  message?: string;
}

function isPgError(err: unknown): err is PgError {
  return typeof err === "object" && err !== null && "code" in err;
}

/** Traduz erros conhecidos do Postgres/validação para mensagens amigáveis. */
export function describeDbError(err: unknown): { status: number; message: string } {
  if (err instanceof HttpError) {
    return { status: err.status, message: err.message };
  }

  if (isPgError(err)) {
    if (err.code === "23505") {
      if (err.constraint?.includes("foto_hash") || err.constraint?.includes("submissions_foto_hash")) {
        return {
          status: 409,
          message: "Esta foto já foi usada em outra submissão. Envie uma foto original.",
        };
      }
      if (err.constraint?.includes("email")) {
        return { status: 409, message: "Este e-mail já está cadastrado." };
      }
      return { status: 409, message: "Registro duplicado." };
    }

    if (err.code === "P0001") {
      const msg = err.message ?? "";
      if (msg.includes("rate_limit_exceeded")) {
        return {
          status: 429,
          message: "Você atingiu o limite de 5 submissões por dia. Tente novamente amanhã.",
        };
      }
      if (msg.includes("forbidden")) {
        return { status: 403, message: "Você não pode moderar sua própria submissão." };
      }
      if (msg.includes("submission_locked")) {
        return { status: 409, message: "Esta submissão já foi revisada e não pode mais ser editada." };
      }
      return { status: 400, message: msg };
    }

    if (err.code === "23514") {
      return { status: 400, message: "Dados inválidos: violam uma regra de validação do banco." };
    }
  }

  if (err instanceof Error) {
    return { status: 500, message: err.message };
  }

  return { status: 500, message: "Erro inesperado no servidor." };
}

export function jsonError(err: unknown): Response {
  const { status, message } = describeDbError(err);
  return Response.json({ ok: false, error: message }, { status });
}

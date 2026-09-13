export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

/** Calcula o hash SHA-256 de um arquivo no cliente via Web Crypto API,
 * usado para detecção de fotos duplicadas (a constraint UNIQUE real vive no
 * banco; isto apenas prepara o valor a ser enviado). */
export async function sha256File(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function formatFone(value: string | number): string {
  const n = typeof value === "string" ? Number(value) : value;
  if (Number.isNaN(n)) return "0.0000";
  return n.toLocaleString("pt-BR", { minimumFractionDigits: 4, maximumFractionDigits: 4 });
}

export function formatDate(iso: string, locale = "pt-BR"): string {
  try {
    return new Date(iso).toLocaleString(locale, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export const MISSION_CATEGORY_EMOJI: Record<string, string> = {
  plantio: "🌳",
  doacao: "🤝",
  reciclagem: "♻️",
  mutirao: "🧹",
  outro: "🌱",
};

export const MAX_PHOTO_BYTES = 8 * 1024 * 1024;
export const MIN_REPORT_LEN = 50;
export const MAX_REPORT_LEN = 1000;

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { requireUser } from "@/lib/auth";
import { jsonError } from "@/lib/api-utils";
import { MAX_PHOTO_BYTES } from "@/lib/utils";

export const runtime = "nodejs";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);
const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export async function POST(request: Request) {
  try {
    await requireUser();

    const form = await request.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      return Response.json({ ok: false, error: "Selecione uma foto." }, { status: 400 });
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return Response.json(
        { ok: false, error: "Arquivo precisa ser uma imagem (JPG, PNG ou WEBP)." },
        { status: 400 },
      );
    }

    if (file.size > MAX_PHOTO_BYTES) {
      return Response.json(
        { ok: false, error: "A foto deve ter no máximo 8MB." },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // O hash é sempre recalculado no servidor a partir dos bytes reais do
    // arquivo — nunca confiamos em um hash enviado pelo cliente, para que a
    // constraint UNIQUE de anti-duplicata não possa ser burlada.
    const fotoHash = crypto.createHash("sha256").update(buffer).digest("hex");

    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadsDir, { recursive: true });

    const ext = EXT_BY_TYPE[file.type] ?? "jpg";
    const filename = `${crypto.randomUUID()}.${ext}`;
    await writeFile(path.join(uploadsDir, filename), buffer);

    return Response.json({ ok: true, url: `/uploads/${filename}`, fotoHash });
  } catch (err) {
    return jsonError(err);
  }
}

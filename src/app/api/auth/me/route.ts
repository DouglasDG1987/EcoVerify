import { getSessionUser } from "@/lib/auth";
import { jsonError } from "@/lib/api-utils";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getSessionUser();
    return Response.json({ ok: true, user });
  } catch (err) {
    return jsonError(err);
  }
}

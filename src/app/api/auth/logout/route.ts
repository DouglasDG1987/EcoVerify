import { cookies } from "next/headers";
import { SESSION_COOKIE, destroySession, clearSessionCookie } from "@/lib/auth";
import { jsonError } from "@/lib/api-utils";

export async function POST() {
  try {
    const store = await cookies();
    const token = store.get(SESSION_COOKIE)?.value;
    if (token) {
      await destroySession(token);
    }
    await clearSessionCookie();
    return Response.json({ ok: true });
  } catch (err) {
    return jsonError(err);
  }
}

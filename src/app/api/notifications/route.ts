import { db } from "@/db";
import { notifications } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { jsonError } from "@/lib/api-utils";
import { desc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const user = await requireUser();

    const userNotifications = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, user.id))
      .orderBy(desc(notifications.createdAt));

    return Response.json({
      ok: true,
      notifications: userNotifications.map((n) => ({
        ...n,
        createdAt: n.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    return jsonError(err);
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const { notificationId } = body;

    if (!notificationId) {
      return Response.json({ ok: false, error: "ID da notificação é obrigatório" }, { status: 400 });
    }

    const result = await db
      .update(notifications)
      .set({ lida: true })
      .where(eq(notifications.id, notificationId))
      .returning();

    if (result.length === 0) {
      return Response.json({ ok: false, error: "Notificação não encontrada" }, { status: 404 });
    }

    return Response.json({ ok: true, notification: result[0] });
  } catch (err) {
    return jsonError(err);
  }
}
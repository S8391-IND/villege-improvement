import { Router } from "express";
import { db, notificationsTable } from "@village-connect/database";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

router.get("/notifications", requireAuth, async (req, res): Promise<void> => {
  const unreadOnly = req.query.unread === "true";
  const userId = req.user!.id;

  const where = unreadOnly
    ? and(eq(notificationsTable.userId, userId), eq(notificationsTable.isRead, false))
    : eq(notificationsTable.userId, userId);

  const notifications = await db.select().from(notificationsTable)
    .where(where).orderBy(desc(notificationsTable.createdAt));

  res.json(notifications);
});

router.patch("/notifications/read-all", requireAuth, async (req, res): Promise<void> => {
  await db.update(notificationsTable).set({ isRead: true })
    .where(eq(notificationsTable.userId, req.user!.id));
  res.json({ message: "All notifications marked as read" });
});

router.patch("/notifications/:id/read", requireAuth, async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [notif] = await db.update(notificationsTable).set({ isRead: true })
    .where(and(eq(notificationsTable.id, id), eq(notificationsTable.userId, req.user!.id)))
    .returning();

  if (!notif) { res.status(404).json({ error: "Notification not found" }); return; }
  res.json(notif);
});

export default router;

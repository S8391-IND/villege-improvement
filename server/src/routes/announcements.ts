import { Router } from "express";
import { db, announcementsTable, usersTable, notificationsTable } from "@village-connect/database";
import { eq, desc, sql } from "drizzle-orm";
import { z } from "zod";
import { requireAuth, requireAdmin } from "../middlewares/auth.js";
import { safeUser } from "../lib/safeUser.js";

const router = Router();

router.get("/announcements", requireAuth, async (req, res): Promise<void> => {
  const params = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(10),
  }).safeParse(req.query);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const { page, limit } = params.data;
  const offset = (page - 1) * limit;

  const [items, countResult] = await Promise.all([
    db.select().from(announcementsTable).orderBy(desc(announcementsTable.createdAt)).limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(announcementsTable),
  ]);

  const enriched = await Promise.all(items.map(async (item) => {
    const [author] = await db.select().from(usersTable).where(eq(usersTable.id, item.authorId));
    return { ...item, author: safeUser(author) };
  }));

  res.json({ announcements: enriched, total: Number(countResult[0]?.count ?? 0), page, limit });
});

router.get("/announcements/:id", requireAuth, async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [item] = await db.select().from(announcementsTable).where(eq(announcementsTable.id, id));
  if (!item) { res.status(404).json({ error: "Announcement not found" }); return; }

  const [author] = await db.select().from(usersTable).where(eq(usersTable.id, item.authorId));
  res.json({ ...item, author: safeUser(author) });
});

router.post("/announcements", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const parsed = z.object({
    title: z.string().min(3),
    content: z.string().min(10),
  }).safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [announcement] = await db.insert(announcementsTable)
    .values({ ...parsed.data, authorId: req.user!.id }).returning();

  // notify all other users
  const allUsers = await db.select({ id: usersTable.id }).from(usersTable);
  await Promise.all(allUsers
    .filter(u => u.id !== req.user!.id)
    .map(u => db.insert(notificationsTable).values({
      userId: u.id, type: "new_announcement",
      message: `New announcement: ${parsed.data.title}`,
      isRead: false, referenceId: announcement.id,
    }))
  );

  const [author] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.id));
  res.status(201).json({ ...announcement, author: safeUser(author) });
});

router.delete("/announcements/:id", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [deleted] = await db.delete(announcementsTable).where(eq(announcementsTable.id, id)).returning();
  if (!deleted) { res.status(404).json({ error: "Announcement not found" }); return; }
  res.json({ message: "Deleted" });
});

export default router;

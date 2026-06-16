import { Router } from "express";
import { db, meetingsTable, usersTable } from "@village-connect/database";
import { eq, asc } from "drizzle-orm";
import { z } from "zod";
import { requireAuth, requireAdmin } from "../middlewares/auth.js";
import { safeUser } from "../lib/safeUser.js";

const router = Router();

router.get("/meetings", requireAuth, async (_req, res): Promise<void> => {
  const meetings = await db.select().from(meetingsTable).orderBy(asc(meetingsTable.scheduledAt));
  const enriched = await Promise.all(meetings.map(async (m) => {
    const [author] = await db.select().from(usersTable).where(eq(usersTable.id, m.authorId));
    return { ...m, description: m.description ?? null, author: safeUser(author) };
  }));
  res.json(enriched);
});

router.post("/meetings", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const parsed = z.object({
    title: z.string().min(3),
    description: z.string().optional(),
    meetingUrl: z.string().url(),
    scheduledAt: z.string().datetime(),
  }).safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [meeting] = await db.insert(meetingsTable).values({
    ...parsed.data,
    scheduledAt: new Date(parsed.data.scheduledAt),
    authorId: req.user!.id,
  }).returning();

  const [author] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.id));
  res.status(201).json({ ...meeting, description: meeting.description ?? null, author: safeUser(author) });
});

router.delete("/meetings/:id", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [deleted] = await db.delete(meetingsTable).where(eq(meetingsTable.id, id)).returning();
  if (!deleted) { res.status(404).json({ error: "Meeting not found" }); return; }
  res.json({ message: "Deleted" });
});

export default router;

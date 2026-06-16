import { Router } from "express";
import { db, usersTable, contactRequestsTable } from "@village-connect/database";
import { eq, or, and, ilike, sql } from "drizzle-orm";
import { z } from "zod";
import { requireAuth } from "../middlewares/auth.js";
import { safeUser } from "../lib/safeUser.js";

const router = Router();

router.get("/users", requireAuth, async (req, res): Promise<void> => {
  const params = z.object({
    search: z.string().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  }).safeParse(req.query);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const { search, page, limit } = params.data;
  const offset = (page - 1) * limit;

  const condition = search
    ? or(ilike(usersTable.name, `%${search}%`), ilike(usersTable.houseNumber, `%${search}%`))
    : undefined;

  const [users, countResult] = await Promise.all([
    db.select().from(usersTable).where(condition).limit(limit).offset(offset).orderBy(usersTable.name),
    db.select({ count: sql<number>`count(*)` }).from(usersTable).where(condition),
  ]);

  res.json({ users: users.map(safeUser), total: Number(countResult[0]?.count ?? 0), page, limit });
});

router.get("/users/:id", requireAuth, async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id));
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  const currentId = req.user!.id;
  let contactRequestStatus = "none";
  let phone: string | null = null;

  if (currentId === id) {
    contactRequestStatus = "self";
    phone = user.phone ?? null;
  } else {
    const [request] = await db.select().from(contactRequestsTable).where(
      or(
        and(eq(contactRequestsTable.requesterId, currentId), eq(contactRequestsTable.targetId, id)),
        and(eq(contactRequestsTable.requesterId, id), eq(contactRequestsTable.targetId, currentId))
      )
    );
    if (request) {
      contactRequestStatus = request.status;
      if (request.status === "approved") phone = user.phone ?? null;
    }
  }

  res.json({ ...safeUser(user), phone, contactRequestStatus });
});

router.patch("/users/:id/profile", requireAuth, async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  if (req.user!.id !== id && req.user!.role !== "admin") { res.status(403).json({ error: "Forbidden" }); return; }

  const parsed = z.object({
    name: z.string().min(2).optional(),
    houseNumber: z.string().min(1).optional(),
    familyCount: z.number().int().min(1).optional(),
    phone: z.string().nullable().optional(),
    avatarUrl: z.string().url().nullable().optional(),
    bio: z.string().max(500).nullable().optional(),
  }).safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const updates: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(parsed.data)) {
    if (v !== undefined) updates[k === "houseNumber" ? "houseNumber" : k] = v;
  }

  const [updated] = await db.update(usersTable).set(updates).where(eq(usersTable.id, id)).returning();
  res.json(safeUser(updated));
});

export default router;

import { Router } from "express";
import { db, listingsTable, usersTable } from "@village-connect/database";
import { eq, ilike, and, desc, sql } from "drizzle-orm";
import { z } from "zod";
import { requireAuth } from "../middlewares/auth.js";
import { safeUser } from "../lib/safeUser.js";

const router = Router();

const toListing = (item: typeof listingsTable.$inferSelect, author: ReturnType<typeof safeUser>) => ({
  ...item, imageUrl: item.imageUrl ?? null,
  price: item.price !== null ? Number(item.price) : null, author,
});

router.get("/marketplace", requireAuth, async (req, res): Promise<void> => {
  const params = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(12),
    search: z.string().optional(),
    category: z.string().optional(),
  }).safeParse(req.query);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const { page, limit, search, category } = params.data;
  const offset = (page - 1) * limit;
  const conditions = [];
  if (search) conditions.push(ilike(listingsTable.title, `%${search}%`));
  if (category) conditions.push(eq(listingsTable.category, category));
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [items, countResult] = await Promise.all([
    db.select().from(listingsTable).where(where).orderBy(desc(listingsTable.createdAt)).limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(listingsTable).where(where),
  ]);

  const enriched = await Promise.all(items.map(async (item) => {
    const [author] = await db.select().from(usersTable).where(eq(usersTable.id, item.authorId));
    return toListing(item, safeUser(author));
  }));

  res.json({ listings: enriched, total: Number(countResult[0]?.count ?? 0), page, limit });
});

router.get("/marketplace/:id", requireAuth, async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [item] = await db.select().from(listingsTable).where(eq(listingsTable.id, id));
  if (!item) { res.status(404).json({ error: "Listing not found" }); return; }
  const [author] = await db.select().from(usersTable).where(eq(usersTable.id, item.authorId));
  res.json(toListing(item, safeUser(author)));
});

router.post("/marketplace", requireAuth, async (req, res): Promise<void> => {
  const parsed = z.object({
    title: z.string().min(3),
    description: z.string().min(10),
    category: z.string().min(1),
    imageUrl: z.string().url().optional(),
    price: z.number().min(0).optional(),
  }).safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [listing] = await db.insert(listingsTable).values({
    ...parsed.data,
    price: parsed.data.price !== undefined ? String(parsed.data.price) : null,
    authorId: req.user!.id,
  }).returning();

  const [author] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.id));
  res.status(201).json(toListing(listing, safeUser(author)));
});

router.delete("/marketplace/:id", requireAuth, async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [item] = await db.select().from(listingsTable).where(eq(listingsTable.id, id));
  if (!item) { res.status(404).json({ error: "Listing not found" }); return; }
  if (item.authorId !== req.user!.id && req.user!.role !== "admin") { res.status(403).json({ error: "Forbidden" }); return; }
  await db.delete(listingsTable).where(eq(listingsTable.id, id));
  res.json({ message: "Deleted" });
});

export default router;

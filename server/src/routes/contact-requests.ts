import { Router } from "express";
import { db, contactRequestsTable, usersTable, notificationsTable } from "@village-connect/database";
import { eq, or, and } from "drizzle-orm";
import { z } from "zod";
import { requireAuth } from "../middlewares/auth.js";
import { safeUser } from "../lib/safeUser.js";

const router = Router();

async function enrichRequest(r: typeof contactRequestsTable.$inferSelect) {
  const [requester] = await db.select().from(usersTable).where(eq(usersTable.id, r.requesterId));
  const [target] = await db.select().from(usersTable).where(eq(usersTable.id, r.targetId));
  return { ...r, requester: safeUser(requester), target: safeUser(target) };
}

router.get("/contact-requests", requireAuth, async (req, res): Promise<void> => {
  const type = req.query.type as string | undefined;
  const userId = req.user!.id;

  const where = type === "sent"
    ? eq(contactRequestsTable.requesterId, userId)
    : type === "received"
      ? eq(contactRequestsTable.targetId, userId)
      : or(eq(contactRequestsTable.requesterId, userId), eq(contactRequestsTable.targetId, userId));

  const requests = await db.select().from(contactRequestsTable).where(where);
  const enriched = await Promise.all(requests.map(enrichRequest));
  res.json(enriched);
});

router.post("/contact-requests", requireAuth, async (req, res): Promise<void> => {
  const parsed = z.object({ targetId: z.number().int() }).safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const requesterId = req.user!.id;
  const { targetId } = parsed.data;
  if (requesterId === targetId) { res.status(400).json({ error: "Cannot request your own contact" }); return; }

  const [existing] = await db.select().from(contactRequestsTable).where(
    or(
      and(eq(contactRequestsTable.requesterId, requesterId), eq(contactRequestsTable.targetId, targetId)),
      and(eq(contactRequestsTable.requesterId, targetId), eq(contactRequestsTable.targetId, requesterId))
    )
  );
  if (existing) { res.status(409).json({ error: "Contact request already exists" }); return; }

  const [request] = await db.insert(contactRequestsTable)
    .values({ requesterId, targetId, status: "pending" }).returning();

  await db.insert(notificationsTable).values({
    userId: targetId, type: "contact_request",
    message: `${req.user!.name} has requested your contact information`,
    isRead: false, referenceId: request.id,
  });

  res.status(201).json(await enrichRequest(request));
});

router.patch("/contact-requests/:id/respond", requireAuth, async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  const parsed = z.object({ action: z.enum(["approve", "reject"]) }).safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [request] = await db.select().from(contactRequestsTable).where(eq(contactRequestsTable.id, id));
  if (!request) { res.status(404).json({ error: "Request not found" }); return; }
  if (request.targetId !== req.user!.id) { res.status(403).json({ error: "Forbidden" }); return; }

  const newStatus = parsed.data.action === "approve" ? "approved" : "rejected";
  const [updated] = await db.update(contactRequestsTable).set({ status: newStatus })
    .where(eq(contactRequestsTable.id, id)).returning();

  await db.insert(notificationsTable).values({
    userId: request.requesterId,
    type: newStatus === "approved" ? "contact_approved" : "contact_rejected",
    message: newStatus === "approved"
      ? `${req.user!.name} approved your contact request`
      : `${req.user!.name} rejected your contact request`,
    isRead: false, referenceId: request.id,
  });

  res.json(await enrichRequest(updated));
});

export default router;

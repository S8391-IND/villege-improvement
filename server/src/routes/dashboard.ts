import { Router } from "express";
import { db, usersTable, announcementsTable, listingsTable, meetingsTable, notificationsTable, contactRequestsTable } from "@village-connect/database";
import { eq, gte, desc, sql } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth.js";
import { safeUser } from "../lib/safeUser.js";

const router = Router();

router.get("/dashboard/summary", requireAuth, async (req, res): Promise<void> => {
  const userId = req.user!.id;
  const now = new Date();

  const [
    totalResidentsResult, totalAnnouncementsResult, totalListingsResult,
    upcomingMeetingsResult, pendingContactRequestsResult, unreadNotificationsResult,
    recentAnnouncementsRaw, recentListingsRaw,
  ] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(usersTable),
    db.select({ count: sql<number>`count(*)` }).from(announcementsTable),
    db.select({ count: sql<number>`count(*)` }).from(listingsTable),
    db.select({ count: sql<number>`count(*)` }).from(meetingsTable).where(gte(meetingsTable.scheduledAt, now)),
    db.select({ count: sql<number>`count(*)` }).from(contactRequestsTable)
      .where(eq(contactRequestsTable.targetId, userId)).where(eq(contactRequestsTable.status, "pending")),
    db.select({ count: sql<number>`count(*)` }).from(notificationsTable)
      .where(eq(notificationsTable.userId, userId)).where(eq(notificationsTable.isRead, false)),
    db.select().from(announcementsTable).orderBy(desc(announcementsTable.createdAt)).limit(3),
    db.select().from(listingsTable).orderBy(desc(listingsTable.createdAt)).limit(4),
  ]);

  const recentAnnouncements = await Promise.all(recentAnnouncementsRaw.map(async (a) => {
    const [author] = await db.select().from(usersTable).where(eq(usersTable.id, a.authorId));
    return { ...a, author: safeUser(author) };
  }));

  const recentListings = await Promise.all(recentListingsRaw.map(async (l) => {
    const [author] = await db.select().from(usersTable).where(eq(usersTable.id, l.authorId));
    return { ...l, imageUrl: l.imageUrl ?? null, price: l.price !== null ? Number(l.price) : null, author: safeUser(author) };
  }));

  res.json({
    totalResidents: Number(totalResidentsResult[0]?.count ?? 0),
    totalAnnouncements: Number(totalAnnouncementsResult[0]?.count ?? 0),
    totalListings: Number(totalListingsResult[0]?.count ?? 0),
    upcomingMeetings: Number(upcomingMeetingsResult[0]?.count ?? 0),
    pendingContactRequests: Number(pendingContactRequestsResult[0]?.count ?? 0),
    unreadNotifications: Number(unreadNotificationsResult[0]?.count ?? 0),
    recentAnnouncements,
    recentListings,
  });
});

export default router;

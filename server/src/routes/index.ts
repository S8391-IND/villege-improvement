import { Router } from "express";
import authRoutes from "./auth.js";
import userRoutes from "./users.js";
import announcementRoutes from "./announcements.js";
import meetingRoutes from "./meetings.js";
import marketplaceRoutes from "./marketplace.js";
import notificationRoutes from "./notifications.js";
import contactRequestRoutes from "./contact-requests.js";
import dashboardRoutes from "./dashboard.js";

const router = Router();

router.use(authRoutes);
router.use(userRoutes);
router.use(announcementRoutes);
router.use(meetingRoutes);
router.use(marketplaceRoutes);
router.use(notificationRoutes);
router.use(contactRequestRoutes);
router.use(dashboardRoutes);

export default router;

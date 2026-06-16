import { Router } from "express";
import { db, usersTable } from "@village-connect/database";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { requireAuth } from "../middlewares/auth.js";
import { safeUser } from "../lib/safeUser.js";

const router = Router();

const RegisterBody = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  houseNumber: z.string().min(1),
  familyCount: z.number().int().min(1).optional(),
  phone: z.string().optional(),
});

const LoginBody = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post("/auth/register", async (req, res): Promise<void> => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const { name, email, password, houseNumber, familyCount, phone } = parsed.data;
  const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (existing) { res.status(409).json({ error: "Email already in use" }); return; }

  const passwordHash = await bcrypt.hash(password, 10);
  const [user] = await db.insert(usersTable).values({
    name, email, passwordHash, houseNumber,
    familyCount: familyCount ?? 1,
    phone: phone ?? null,
    role: "resident",
  }).returning();

  req.session.userId = user.id;
  res.status(201).json({ user: safeUser(user), message: "Registered successfully" });
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const { email, password } = parsed.data;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (!user) { res.status(401).json({ error: "Invalid email or password" }); return; }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) { res.status(401).json({ error: "Invalid email or password" }); return; }

  req.session.userId = user.id;
  res.json({ user: safeUser(user), message: "Logged in" });
});

router.post("/auth/logout", (req, res): void => {
  req.session.destroy(() => {});
  res.json({ message: "Logged out" });
});

router.get("/auth/me", requireAuth, (req, res): void => {
  res.json(safeUser(req.user!));
});

export default router;

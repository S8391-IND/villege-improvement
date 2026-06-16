import { pgTable, text, timestamp, json } from "drizzle-orm/pg-core";

export const userSessionsTable = pgTable("user_sessions", {
  sid: text("sid").primaryKey(),
  sess: json("sess").notNull(),
  expire: timestamp("expire", { withTimezone: true }).notNull(),
});

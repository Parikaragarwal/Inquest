import { pgTable, uuid, varchar, timestamp } from "drizzle-orm/pg-core";

export const otpsTable = pgTable("otps", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  otp: varchar("otp", { length: 6 }).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export type SelectOTP = typeof otpsTable.$inferSelect;
export type InsertOTP = typeof otpsTable.$inferInsert;

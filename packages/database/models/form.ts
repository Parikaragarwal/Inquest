import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { usersTable } from "./user";

export const formsTable = pgTable(
  "forms",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    secureCode: varchar("secure_code", { length: 255 }).unique(),

    createdBy: uuid("created_by")
      .notNull()
      .references(() => usersTable.id),

    title: varchar("title", { length: 255 }).notNull(),

    description: text("description"),

    isOpenForSubmission: boolean("is_open_for_submission")
      .notNull()
      .default(true),

    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
  },
  (table) => [index("forms_created_by_index").on(table.createdBy)]
);

export type SelectForm = typeof formsTable.$inferSelect;
export type InsertForm = typeof formsTable.$inferInsert;

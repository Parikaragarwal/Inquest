import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  boolean,
  text,
  jsonb,
  numeric,
  index,
  unique,
} from "drizzle-orm/pg-core";
import { formsTable } from "./form";

export const formFieldTypeEnum = pgEnum("form_field_type", [
  "text",
  "textarea",
  "number",
  "email",
  "phone",
  "boolean",
  "date",
  "single_select",
  "multi_select",
  "rating",
]);

export const formFieldTable = pgTable(
  "form_field",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    label: varchar("label", { length: 255 }).notNull(),

    type: formFieldTypeEnum("type").notNull(),

    required: boolean("required").notNull().default(false),

    placeholder: text("placeholder"),

    validation: jsonb("validation"),

    orderIndex: numeric("order_index", { precision: 20, scale: 10 }).notNull(),

    formId: uuid("form_id")
      .notNull()
      .references(() => formsTable.id, { onDelete: "cascade" }),
  },
  (table) => [
    index("form_field_form_id_index").on(table.formId),
    unique("form_field_form_order_index_unique").on(
      table.formId,
      table.orderIndex
    ),
  ]
);

export type SelectFormField = typeof formFieldTable.$inferSelect;
export type InsertFormField = typeof formFieldTable.$inferInsert;

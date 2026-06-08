import {
  pgTable,
  uuid,
  text,
  index,
  unique,
} from "drizzle-orm/pg-core";
import { formFieldTable } from "./form-field";
import { usersTable } from "./user";

export const answerTable = pgTable(
  "answer",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    formFieldId: uuid("form_field_id")
      .notNull()
      .references(() => formFieldTable.id, { onDelete: "cascade" }),

    answer: text("answer").notNull(),

    submitterId: uuid("submitter_id")
      .notNull()
      .references(() => usersTable.id),
  },
  (table) => [
    index("answer_form_field_id_index").on(table.formFieldId),
    index("answer_submitter_id_index").on(table.submitterId),
    unique("answer_form_field_submitter_unique").on(
      table.formFieldId,
      table.submitterId
    ),
  ]
);

export type SelectAnswer = typeof answerTable.$inferSelect;
export type InsertAnswer = typeof answerTable.$inferInsert;

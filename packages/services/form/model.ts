import { z } from "zod";
import { FORM_FIELD_TYPES } from "./validation";

export const fieldInput = z.object({
  id: z.string().uuid().optional(),
  label: z.string().min(1, "Field label is required"),
  type: z.enum(FORM_FIELD_TYPES),
  required: z.boolean(),
  placeholder: z.string().optional().nullable(),
  validation: z.record(z.string(), z.any()).optional().nullable(),
  orderIndex: z.number(),
});

export const createFormInput = z.object({
  userId: z.string().uuid(),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional().nullable(),
  secureCode: z.string().optional().nullable(),
  isOpenForSubmission: z.boolean().default(true),
  requiresAuth: z.boolean().default(true),
  theme: z.record(z.string(), z.any()).optional().nullable(),
  fields: z.array(fieldInput).min(1, "At least one field is required"),
});

export const updateFormInput = z.object({
  userId: z.string().uuid(),
  id: z.string().uuid(),
  title: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  secureCode: z.string().optional().nullable(),
  isOpenForSubmission: z.boolean().optional(),
  requiresAuth: z.boolean().optional(),
  theme: z.record(z.string(), z.any()).optional().nullable(),
  fields: z.array(fieldInput).min(1, "At least one field is required"),
});

export type FieldInputType = z.infer<typeof fieldInput>;
export type CreateFormInputType = z.infer<typeof createFormInput>;
export type UpdateFormInputType = z.infer<typeof updateFormInput>;

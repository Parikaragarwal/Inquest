import { z } from "zod";
import { FORM_FIELD_TYPES } from "@repo/services/form/validation";

// ─── Shared field schemas ──────────────────────────────

const fieldInputModel = z.object({
  id: z.string().uuid().optional(),
  label: z.string().min(1),
  type: z.enum(FORM_FIELD_TYPES),
  required: z.boolean(),
  placeholder: z.string().optional().nullable(),
  validation: z.record(z.string(), z.any()).optional().nullable(),
  orderIndex: z.number(),
});

const fieldOutputModel = z.object({
  id: z.string(),
  label: z.string(),
  type: z.string(),
  required: z.boolean(),
  placeholder: z.string().nullable(),
  validation: z.unknown().nullable(),
  orderIndex: z.string(),
  formId: z.string(),
});

const formOutputModel = z.object({
  id: z.string(),
  secureCode: z.string().nullable(),
  createdBy: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  isOpenForSubmission: z.boolean(),
  createdAt: z.date().nullable(),
  updatedAt: z.date().nullable(),
  fields: z.array(fieldOutputModel),
});

const publicFormOutputModel = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  isOpenForSubmission: z.boolean(),
  fields: z.array(fieldOutputModel),
});

// ─── Create Form ──────────────────────────────────────

export const createFormInputModel = z.object({
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  secureCode: z.string().optional().nullable(),
  isOpenForSubmission: z.boolean().default(true),
  fields: z.array(fieldInputModel).min(1),
});

export const createFormOutputModel = formOutputModel;

// ─── Update Form ──────────────────────────────────────

export const updateFormInputModel = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  secureCode: z.string().optional().nullable(),
  isOpenForSubmission: z.boolean().optional(),
  fields: z.array(fieldInputModel).min(1),
});

export const updateFormOutputModel = formOutputModel;

// ─── Delete Form ──────────────────────────────────────

export const deleteFormInputModel = z.object({
  id: z.string().uuid(),
});

export const deleteFormOutputModel = z.object({
  id: z.string(),
  deleted: z.boolean(),
});

// ─── Get Form By ID ───────────────────────────────────

export const getFormByIdInputModel = z.object({
  id: z.string().uuid(),
});

export const getFormByIdOutputModel = formOutputModel;

// ─── Get My Forms ─────────────────────────────────────

export const getMyFormsInputModel = z.undefined();

export const getMyFormsOutputModel = z.array(formOutputModel);

// ─── Get Form For Submission ──────────────────────────

export const getFormForSubmissionInputModel = z.object({
  formId: z.string().uuid(),
  secureCode: z.string().optional().nullable(),
});

export const getFormForSubmissionOutputModel = publicFormOutputModel;

// ─── Set Form Submission Status ───────────────────────

export const setFormSubmissionStatusInputModel = z.object({
  id: z.string().uuid(),
  isOpenForSubmission: z.boolean(),
});

export const setFormSubmissionStatusOutputModel = z.object({
  id: z.string(),
  isOpenForSubmission: z.boolean(),
});

// ─── Update Form Secure Code ──────────────────────────

export const updateFormSecureCodeInputModel = z.object({
  id: z.string().uuid(),
  secureCode: z.string().nullable(),
});

export const updateFormSecureCodeOutputModel = z.object({
  id: z.string(),
  secureCode: z.string().nullable(),
});

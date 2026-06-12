import { z } from "zod";

export const answerInput = z.object({
  formFieldId: z.string().uuid(),
  answer: z.string(),
});

export const submitFormInput = z.object({
  userId: z.string().uuid().optional(),
  formId: z.string().uuid(),
  secureCode: z.string().optional().nullable(),
  answers: z.array(answerInput).min(1, "At least one answer is required"),
});

export const checkUserSubmissionInput = z.object({
  userId: z.string().uuid().optional(),
  formId: z.string().uuid(),
});

export const getFormResponsesInput = z.object({
  userId: z.string().uuid(),
  formId: z.string().uuid(),
});

export const getMyFormResponseInput = z.object({
  userId: z.string().uuid(),
  formId: z.string().uuid(),
});

export const getSubmissionCountInput = z.object({
  userId: z.string().uuid(),
  formId: z.string().uuid(),
});

export const getBasicSubmissionAnalyticsInput = z.object({
  userId: z.string().uuid(),
  formId: z.string().uuid(),
});

export type SubmitFormInputType = z.infer<typeof submitFormInput>;
export type CheckUserSubmissionInputType = z.infer<typeof checkUserSubmissionInput>;
export type GetFormResponsesInputType = z.infer<typeof getFormResponsesInput>;
export type GetMyFormResponseInputType = z.infer<typeof getMyFormResponseInput>;
export type GetSubmissionCountInputType = z.infer<typeof getSubmissionCountInput>;
export type GetBasicSubmissionAnalyticsInputType = z.infer<typeof getBasicSubmissionAnalyticsInput>;

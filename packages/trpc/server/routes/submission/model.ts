import { z } from "zod";

// ─── Submit Form ──────────────────────────────────────

export const submitFormInputModel = z.object({
  formId: z.string().uuid(),
  secureCode: z.string().optional().nullable(),
  answers: z
    .array(
      z.object({
        formFieldId: z.string().uuid(),
        answer: z.string(),
      })
    )
    .min(1),
});

export const submitFormOutputModel = z.array(
  z.object({
    id: z.string(),
    formFieldId: z.string(),
    answer: z.string(),
    submitterId: z.string(),
  })
);

// ─── Check User Submission ────────────────────────────

export const checkUserSubmissionInputModel = z.object({
  formId: z.string().uuid(),
});

export const checkUserSubmissionOutputModel = z.object({
  formId: z.string(),
  userId: z.string(),
  hasSubmitted: z.boolean(),
});

// ─── Get My Form Response ─────────────────────────────

export const getMyFormResponseInputModel = z.object({
  formId: z.string().uuid(),
});

export const getMyFormResponseOutputModel = z.object({
  submitterId: z.string(),
  answers: z.array(
    z.object({
      id: z.string(),
      formFieldId: z.string(),
      answer: z.string(),
      label: z.string(),
      type: z.string(),
    })
  ),
});

// ─── Get Form Responses (Owner) ───────────────────────

export const getFormResponsesInputModel = z.object({
  formId: z.string().uuid(),
});

export const getFormResponsesOutputModel = z.array(
  z.object({
    submitterId: z.string(),
    answers: z.array(
      z.object({
        id: z.string(),
        formFieldId: z.string(),
        label: z.string(),
        type: z.string(),
        answer: z.string(),
      })
    ),
  })
);

// ─── Get Submission Count ─────────────────────────────

export const getSubmissionCountInputModel = z.object({
  formId: z.string().uuid(),
});

export const getSubmissionCountOutputModel = z.object({
  formId: z.string(),
  count: z.number(),
});

// ─── Basic Submission Analytics ───────────────────────

export const getBasicSubmissionAnalyticsInputModel = z.object({
  formId: z.string().uuid(),
});

export const getBasicSubmissionAnalyticsOutputModel = z.object({
  formId: z.string(),
  submissionCount: z.number(),
  fieldAnalytics: z.array(
    z.object({
      fieldId: z.string(),
      label: z.string(),
      type: z.string(),
      answerCount: z.number(),
      valueCounts: z.record(z.string(), z.number()),
    })
  ),
});

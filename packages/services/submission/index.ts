import { randomUUID } from "crypto";
import { db, eq, and, inArray, sql, countDistinct } from "@repo/database";
import { formsTable } from "@repo/database/models/form";
import { formFieldTable } from "@repo/database/models/form-field";
import { answerTable } from "@repo/database/models/answer";
import { validateAnswer } from "../form/validation";
import {
  type SubmitFormInputType,
  type CheckUserSubmissionInputType,
  type GetFormResponsesInputType,
  type GetMyFormResponseInputType,
  type GetSubmissionCountInputType,
  type GetBasicSubmissionAnalyticsInputType,
  submitFormInput,
} from "./model";

function formatAnswerForDisplay(type: string, answer: string): string {
  if (type === "multi_select") {
    try {
      const parsed = JSON.parse(answer);
      if (Array.isArray(parsed)) return parsed.join(", ");
    } catch {}
  }
  if (type === "phone" && answer.includes("|")) {
    const parts = answer.split("|");
    if (parts[0]) return `${parts[0]} ${parts[1]}`;
    return parts[1] || answer;
  }
  return answer;
}

class SubmissionService {
  // ─── Helpers ─────────────────────────────────────────

  private async assertFormOwnership(userId: string, formId: string) {
    const form = await db
      .select({ id: formsTable.id, createdBy: formsTable.createdBy })
      .from(formsTable)
      .where(eq(formsTable.id, formId));

    if (!form || form.length === 0) {
      throw new Error("Form not found");
    }
    if (form[0]!.createdBy !== userId) {
      throw new Error("You do not have permission to access this form");
    }
    return form[0]!;
  }

  // ─── Submit Form ────────────────────────────────────

  public async submitForm(payload: SubmitFormInputType) {
    const input = await submitFormInput.parseAsync(payload);

    return db.transaction(async (tx) => {
      // Load form
      const formRows = await tx
        .select()
        .from(formsTable)
        .where(eq(formsTable.id, input.formId));

      if (!formRows || formRows.length === 0) {
        throw new Error("Form not found");
      }
      const form = formRows[0]!;

      // Check open
      if (!form.isOpenForSubmission) {
        throw new Error("This form is no longer accepting submissions");
      }

      // Check secure code
      if (form.secureCode) {
        if (!input.secureCode || input.secureCode.trim().toUpperCase() !== form.secureCode.trim().toUpperCase()) {
          throw new Error("Invalid or missing secure code");
        }
      }

      let submitterId = input.userId;
      if (!submitterId) {
        if (form.requiresAuth) {
          throw new Error("This form requires you to be logged in.");
        }
        submitterId = randomUUID();
      }

      // Load form fields
      const fields = await tx
        .select()
        .from(formFieldTable)
        .where(eq(formFieldTable.formId, form.id));

      if (!fields || fields.length === 0) {
        throw new Error("Form has no fields");
      }

      const fieldMap = new Map(fields.map((f) => [f.id, f]));
      const fieldIds = new Set(fields.map((f) => f.id));

      // Ensure every answer belongs to this form
      for (const ans of input.answers) {
        if (!fieldIds.has(ans.formFieldId)) {
          throw new Error(
            `Answer for field '${ans.formFieldId}' does not belong to this form`
          );
        }
      }

      // Reject duplicate answers for the same field
      const answeredFieldIds = input.answers.map((a) => a.formFieldId);
      if (new Set(answeredFieldIds).size !== answeredFieldIds.length) {
        throw new Error("Duplicate answers for the same field");
      }

      // Ensure every required field has an answer
      const answeredSet = new Set(answeredFieldIds);
      for (const field of fields) {
        if (field.required && !answeredSet.has(field.id)) {
          throw new Error(`Required field '${field.label}' is missing an answer`);
        }
      }

      // Validate each answer
      for (const ans of input.answers) {
        const field = fieldMap.get(ans.formFieldId)!;
        validateAnswer(
          {
            type: field.type,
            required: field.required,
            validation: field.validation,
            label: field.label,
          },
          ans.answer
        );
      }

      // Check user has not already submitted (if they have a real ID or we passed one)
      // For truly anonymous (random UUID), this will just be empty.
      const existingAnswers = await tx
        .select({ id: answerTable.id })
        .from(answerTable)
        .where(
          and(
            inArray(
              answerTable.formFieldId,
              fields.map((f) => f.id)
            ),
            eq(answerTable.submitterId, submitterId)
          )
        );

      if (existingAnswers.length > 0) {
        throw new Error("You have already submitted this form");
      }

      // Insert answers
      const answerValues = input.answers.map((a) => ({
        formFieldId: a.formFieldId,
        answer: a.answer,
        submitterId: submitterId!,
      }));

      const insertedAnswers = await tx
        .insert(answerTable)
        .values(answerValues)
        .returning();

      return insertedAnswers;
    });
  }

  // ─── Check User Submission ──────────────────────────

  public async checkUserSubmission(payload: CheckUserSubmissionInputType) {
    // Load form fields
    const fields = await db
      .select({ id: formFieldTable.id })
      .from(formFieldTable)
      .where(eq(formFieldTable.formId, payload.formId));

    if (!fields || fields.length === 0) {
      return {
        formId: payload.formId,
        userId: payload.userId || "",
        hasSubmitted: false,
      };
    }

    if (!payload.userId) {
      return {
        formId: payload.formId,
        userId: "",
        hasSubmitted: false,
      };
    }

    const existingAnswers = await db
      .select({ id: answerTable.id })
      .from(answerTable)
      .where(
        and(
          inArray(
            answerTable.formFieldId,
            fields.map((f) => f.id)
          ),
          eq(answerTable.submitterId, payload.userId)
        )
      );

    return {
      formId: payload.formId,
      userId: payload.userId || "",
      hasSubmitted: existingAnswers.length > 0,
    };
  }

  // ─── Get My Form Response ───────────────────────────

  public async getMyFormResponse(payload: GetMyFormResponseInputType) {
    const fields = await db
      .select()
      .from(formFieldTable)
      .where(eq(formFieldTable.formId, payload.formId));

    if (!fields || fields.length === 0) {
      return { submitterId: payload.userId, answers: [] };
    }

    const answers = await db
      .select({
        id: answerTable.id,
        formFieldId: answerTable.formFieldId,
        answer: answerTable.answer,
        label: formFieldTable.label,
        type: formFieldTable.type,
      })
      .from(answerTable)
      .innerJoin(formFieldTable, eq(answerTable.formFieldId, formFieldTable.id))
      .where(
        and(
          inArray(
            answerTable.formFieldId,
            fields.map((f) => f.id)
          ),
          eq(answerTable.submitterId, payload.userId)
        )
      );

    const processedAnswers = answers.map((ans) => ({
      ...ans,
      answer: formatAnswerForDisplay(ans.type, ans.answer),
    }));

    return {
      submitterId: payload.userId,
      answers: processedAnswers,
    };
  }

  // ─── Get Form Responses (Owner) ─────────────────────

  public async getFormResponses(payload: GetFormResponsesInputType) {
    await this.assertFormOwnership(payload.userId, payload.formId);

    const fields = await db
      .select()
      .from(formFieldTable)
      .where(eq(formFieldTable.formId, payload.formId));

    if (!fields || fields.length === 0) {
      return [];
    }

    const answers = await db
      .select({
        id: answerTable.id,
        formFieldId: answerTable.formFieldId,
        answer: answerTable.answer,
        submitterId: answerTable.submitterId,
        label: formFieldTable.label,
        type: formFieldTable.type,
      })
      .from(answerTable)
      .innerJoin(formFieldTable, eq(answerTable.formFieldId, formFieldTable.id))
      .where(
        inArray(
          answerTable.formFieldId,
          fields.map((f) => f.id)
        )
      );

    // Group by submitter
    const grouped = new Map<
      string,
      {
        submitterId: string;
        answers: Array<{
          id: string;
          formFieldId: string;
          label: string;
          type: string;
          answer: string;
        }>;
      }
    >();

    for (const ans of answers) {
      if (!grouped.has(ans.submitterId)) {
        grouped.set(ans.submitterId, {
          submitterId: ans.submitterId,
          answers: [],
        });
      }
      grouped.get(ans.submitterId)!.answers.push({
        id: ans.id,
        formFieldId: ans.formFieldId,
        label: ans.label,
        type: ans.type,
        answer: formatAnswerForDisplay(ans.type, ans.answer),
      });
    }

    return Array.from(grouped.values());
  }

  // ─── Get Submission Count (Owner) ───────────────────

  public async getSubmissionCount(payload: GetSubmissionCountInputType) {
    await this.assertFormOwnership(payload.userId, payload.formId);

    const fields = await db
      .select({ id: formFieldTable.id })
      .from(formFieldTable)
      .where(eq(formFieldTable.formId, payload.formId));

    if (!fields || fields.length === 0) {
      return { formId: payload.formId, count: 0 };
    }

    const result = await db
      .select({ count: countDistinct(answerTable.submitterId) })
      .from(answerTable)
      .where(
        inArray(
          answerTable.formFieldId,
          fields.map((f) => f.id)
        )
      );

    return {
      formId: payload.formId,
      count: result[0]?.count ?? 0,
    };
  }

  public async getBasicSubmissionAnalytics(
    payload: GetBasicSubmissionAnalyticsInputType
  ) {
    await this.assertFormOwnership(payload.userId, payload.formId);

    const fields = await db
      .select()
      .from(formFieldTable)
      .where(eq(formFieldTable.formId, payload.formId));

    if (!fields || fields.length === 0) {
      return {
        formId: payload.formId,
        submissionCount: 0,
        fieldAnalytics: [],
        timeline: [],
      };
    }

    const fieldIds = fields.map((f) => f.id);

    // Submission count
    const countResult = await db
      .select({ count: countDistinct(answerTable.submitterId) })
      .from(answerTable)
      .where(inArray(answerTable.formFieldId, fieldIds));

    const submissionCount = countResult[0]?.count ?? 0;

    // Get submission times grouped by submitter to calculate a daily timeline
    const submissionTimes = await db
      .select({
        submitterId: answerTable.submitterId,
        submittedAt: sql<string>`min(${answerTable.createdAt})`,
      })
      .from(answerTable)
      .where(inArray(answerTable.formFieldId, fieldIds))
      .groupBy(answerTable.submitterId);

    const dateCounts: Record<string, number> = {};
    for (const sub of submissionTimes) {
      if (sub.submittedAt) {
        const d = new Date(sub.submittedAt);
        const yyyymmdd = d.toISOString().split("T")[0]!;
        dateCounts[yyyymmdd] = (dateCounts[yyyymmdd] ?? 0) + 1;
      }
    }

    const timeline = Object.entries(dateCounts)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Per-field analytics
    const fieldAnalytics = [];
    for (const field of fields) {
      const answers = await db
        .select({ answer: answerTable.answer })
        .from(answerTable)
        .where(eq(answerTable.formFieldId, field.id));

      const answerCount = answers.length;
      const valueCounts: Record<string, number> = {};
      let stats: { min?: number; max?: number; average?: number } | undefined = undefined;

      if (field.type === "number" && answerCount > 0) {
        const nums = answers
          .map((a) => Number(a.answer))
          .filter((n) => !isNaN(n));
        if (nums.length > 0) {
          const min = Math.min(...nums);
          const max = Math.max(...nums);
          const average = nums.reduce((sum, n) => sum + n, 0) / nums.length;
          stats = {
            min,
            max,
            average: parseFloat(average.toFixed(2)),
          };
        }
      }

      for (const a of answers) {
        if (field.type === "multi_select") {
          try {
            const parsed = JSON.parse(a.answer);
            if (Array.isArray(parsed)) {
              for (const val of parsed) {
                valueCounts[val] = (valueCounts[val] ?? 0) + 1;
              }
            } else {
              valueCounts[a.answer] = (valueCounts[a.answer] ?? 0) + 1;
            }
          } catch (e) {
            valueCounts[a.answer] = (valueCounts[a.answer] ?? 0) + 1;
          }
        } else {
          valueCounts[a.answer] = (valueCounts[a.answer] ?? 0) + 1;
        }
      }

      fieldAnalytics.push({
        fieldId: field.id,
        label: field.label,
        type: field.type,
        answerCount,
        valueCounts,
        stats,
      });
    }

    return {
      formId: payload.formId,
      submissionCount,
      fieldAnalytics,
      timeline,
    };
  }
}
export default SubmissionService;

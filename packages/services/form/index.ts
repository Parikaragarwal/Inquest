import { db, eq, and, desc, asc, inArray } from "@repo/database";
import { formsTable } from "@repo/database/models/form";
import { formFieldTable } from "@repo/database/models/form-field";
import {
  type CreateFormInputType,
  type UpdateFormInputType,
  createFormInput,
  updateFormInput,
} from "./model";
import { validateFieldConfiguration } from "./validation";

class FormService {
  // ─── Helpers ─────────────────────────────────────────

  private async assertOwnership(userId: string, formId: string) {
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

  private validateUniqueOrderIndexes(
    fields: { orderIndex: number }[]
  ): void {
    const orderIndexes = fields.map((f) => f.orderIndex);
    const unique = new Set(orderIndexes);
    if (unique.size !== orderIndexes.length) {
      throw new Error("Field order indexes must be unique");
    }
  }

  private async getFormWithFields(formId: string) {
    const formRows = await db
      .select()
      .from(formsTable)
      .where(eq(formsTable.id, formId));

    if (!formRows || formRows.length === 0) return null;

    const fields = await db
      .select()
      .from(formFieldTable)
      .where(eq(formFieldTable.formId, formId))
      .orderBy(asc(formFieldTable.orderIndex));

    return {
      ...formRows[0]!,
      fields,
    };
  }

  // ─── Create Form ────────────────────────────────────

  public async createForm(payload: CreateFormInputType) {
    const input = await createFormInput.parseAsync(payload);

    // Validate unique order indexes
    this.validateUniqueOrderIndexes(input.fields);

    // Validate field configurations
    for (const field of input.fields) {
      validateFieldConfiguration({
        type: field.type,
        validation: field.validation ?? null,
      });
    }

    // Transaction: insert form + fields
    const result = await db.transaction(async (tx) => {
      const formResult = await tx
        .insert(formsTable)
        .values({
          title: input.title,
          description: input.description ?? null,
          secureCode: input.secureCode ?? null,
          isOpenForSubmission: input.isOpenForSubmission,
          createdBy: input.userId,
        })
        .returning({ id: formsTable.id });

      if (!formResult || formResult.length === 0 || !formResult[0]?.id) {
        throw new Error("Failed to create form");
      }

      const formId = formResult[0].id;

      const fieldValues = input.fields.map((f) => {
        const normalizedValidation = validateFieldConfiguration({
          type: f.type,
          validation: f.validation ?? null,
        });
        return {
          label: f.label,
          type: f.type,
          required: f.required,
          placeholder: f.placeholder ?? null,
          validation: normalizedValidation,
          orderIndex: f.orderIndex.toString(),
          formId,
        };
      });

      await tx.insert(formFieldTable).values(fieldValues);

      return formId;
    });

    return this.getFormWithFields(result);
  }

  // ─── Update Form ────────────────────────────────────

  public async updateForm(payload: UpdateFormInputType) {
    const input = await updateFormInput.parseAsync(payload);

    await this.assertOwnership(input.userId, input.id);

    // Validate unique order indexes
    this.validateUniqueOrderIndexes(input.fields);

    // Validate field IDs are unique when supplied
    const fieldIdsInPayload = input.fields
      .filter((f) => f.id)
      .map((f) => f.id!);
    if (new Set(fieldIdsInPayload).size !== fieldIdsInPayload.length) {
      throw new Error("Duplicate field IDs in update payload");
    }

    // Validate field configurations
    for (const field of input.fields) {
      validateFieldConfiguration({
        type: field.type,
        validation: field.validation ?? null,
      });
    }

    await db.transaction(async (tx) => {
      // Update form metadata
      const updateData: Record<string, unknown> = {};
      if (input.title !== undefined) updateData.title = input.title;
      if (input.description !== undefined)
        updateData.description = input.description;
      if (input.secureCode !== undefined)
        updateData.secureCode = input.secureCode;
      if (input.isOpenForSubmission !== undefined)
        updateData.isOpenForSubmission = input.isOpenForSubmission;

      if (Object.keys(updateData).length > 0) {
        await tx
          .update(formsTable)
          .set(updateData)
          .where(eq(formsTable.id, input.id));
      }

      // Get existing fields
      const existingFields = await tx
        .select()
        .from(formFieldTable)
        .where(eq(formFieldTable.formId, input.id));

      const existingFieldIds = new Set(existingFields.map((f) => f.id));

      // Validate that provided field IDs belong to this form
      for (const fId of fieldIdsInPayload) {
        if (!existingFieldIds.has(fId)) {
          throw new Error(
            `Field ID '${fId}' does not belong to this form`
          );
        }
      }

      // Determine which fields to keep, create, delete
      const retainedFieldIds = new Set(fieldIdsInPayload);
      const fieldsToDelete = existingFields.filter(
        (f) => !retainedFieldIds.has(f.id)
      );

      // Delete removed fields
      if (fieldsToDelete.length > 0) {
        const idsToDelete = fieldsToDelete.map((f) => f.id);
        await tx
          .delete(formFieldTable)
          .where(
            and(
              eq(formFieldTable.formId, input.id),
              inArray(formFieldTable.id, idsToDelete)
            )
          );
      }

      // Move retained fields to temporary negative order indexes
      // to avoid unique constraint conflicts
      for (let i = 0; i < input.fields.length; i++) {
        const field = input.fields[i]!;
        if (field.id) {
          await tx
            .update(formFieldTable)
            .set({ orderIndex: (-1 * (i + 1)).toString() })
            .where(eq(formFieldTable.id, field.id));
        }
      }

      // Upsert fields with final values
      for (const field of input.fields) {
        const normalizedValidation = validateFieldConfiguration({
          type: field.type,
          validation: field.validation ?? null,
        });

        if (field.id) {
          // Update existing
          await tx
            .update(formFieldTable)
            .set({
              label: field.label,
              type: field.type,
              required: field.required,
              placeholder: field.placeholder ?? null,
              validation: normalizedValidation,
              orderIndex: field.orderIndex.toString(),
            })
            .where(eq(formFieldTable.id, field.id));
        } else {
          // Insert new
          await tx.insert(formFieldTable).values({
            label: field.label,
            type: field.type,
            required: field.required,
            placeholder: field.placeholder ?? null,
            validation: normalizedValidation,
            orderIndex: field.orderIndex.toString(),
            formId: input.id,
          });
        }
      }
    });

    return this.getFormWithFields(input.id);
  }

  // ─── Delete Form ────────────────────────────────────

  public async deleteForm(payload: { userId: string; id: string }) {
    await this.assertOwnership(payload.userId, payload.id);

    await db.transaction(async (tx) => {
      await tx.delete(formsTable).where(eq(formsTable.id, payload.id));
    });

    return { id: payload.id, deleted: true };
  }

  // ─── Get Form By ID (Owner) ─────────────────────────

  public async getFormById(payload: { userId: string; id: string }) {
    await this.assertOwnership(payload.userId, payload.id);
    const form = await this.getFormWithFields(payload.id);
    if (!form) throw new Error("Form not found");
    return form;
  }

  // ─── Get My Forms (Owner) ───────────────────────────

  public async getMyForms(payload: { userId: string }) {
    const forms = await db
      .select()
      .from(formsTable)
      .where(eq(formsTable.createdBy, payload.userId))
      .orderBy(desc(formsTable.createdAt));

    const result = [];
    for (const form of forms) {
      const fields = await db
        .select()
        .from(formFieldTable)
        .where(eq(formFieldTable.formId, form.id))
        .orderBy(asc(formFieldTable.orderIndex));

      result.push({ ...form, fields });
    }

    return result;
  }

  // ─── Get Form For Submission (Public) ───────────────

  public async getFormForSubmission(payload: {
    formId: string;
    secureCode?: string | null;
  }) {
    const formRows = await db
      .select()
      .from(formsTable)
      .where(eq(formsTable.id, payload.formId));

    if (!formRows || formRows.length === 0) {
      throw new Error("Form not found");
    }

    const form = formRows[0]!;

    if (!form.isOpenForSubmission) {
      throw new Error("This form is no longer accepting submissions");
    }

    // Secure code check
    if (form.secureCode !== null) {
      if (!payload.secureCode || payload.secureCode !== form.secureCode) {
        throw new Error("Invalid or missing secure code");
      }
    }

    const fields = await db
      .select()
      .from(formFieldTable)
      .where(eq(formFieldTable.formId, form.id))
      .orderBy(asc(formFieldTable.orderIndex));

    // Return render-safe data — no createdBy, no secureCode
    return {
      id: form.id,
      title: form.title,
      description: form.description,
      isOpenForSubmission: form.isOpenForSubmission,
      fields,
    };
  }

  // ─── Set Form Submission Status ─────────────────────

  public async setFormSubmissionStatus(payload: {
    userId: string;
    id: string;
    isOpenForSubmission: boolean;
  }) {
    await this.assertOwnership(payload.userId, payload.id);

    await db
      .update(formsTable)
      .set({ isOpenForSubmission: payload.isOpenForSubmission })
      .where(eq(formsTable.id, payload.id));

    return { id: payload.id, isOpenForSubmission: payload.isOpenForSubmission };
  }

  // ─── Update Form Secure Code ────────────────────────

  public async updateFormSecureCode(payload: {
    userId: string;
    id: string;
    secureCode: string | null;
  }) {
    await this.assertOwnership(payload.userId, payload.id);

    await db
      .update(formsTable)
      .set({ secureCode: payload.secureCode })
      .where(eq(formsTable.id, payload.id));

    return { id: payload.id, secureCode: payload.secureCode };
  }
}

export default FormService;

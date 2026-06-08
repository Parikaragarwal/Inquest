import { z } from "zod";

// ─── Field Type Enum ─────────────────────────────────────

export const FORM_FIELD_TYPES = [
  "text",
  "textarea",
  "number",
  "email",
  "phone",
  "boolean",
  "date",
  "single_select",
  "multi_select",
] as const;

export type FormFieldType = (typeof FORM_FIELD_TYPES)[number];

// ─── Field Configuration Schemas ─────────────────────────

const safeRegex = z
  .string()
  .refine(
    (val) => {
      try {
        new RegExp(val);
        return true;
      } catch {
        return false;
      }
    },
    { message: "Invalid regular expression pattern" }
  );

export const textConfigSchema = z
  .object({
    minLength: z.number().int().min(0).optional(),
    maxLength: z.number().int().min(0).optional(),
    pattern: safeRegex.optional(),
  })
  .strict()
  .refine(
    (data) => {
      if (data.minLength !== undefined && data.maxLength !== undefined) {
        return data.minLength <= data.maxLength;
      }
      return true;
    },
    { message: "minLength must be <= maxLength" }
  );

export const textareaConfigSchema = textConfigSchema;

export const numberConfigSchema = z
  .object({
    min: z.number().optional(),
    max: z.number().optional(),
  })
  .strict()
  .refine(
    (data) => {
      if (data.min !== undefined && data.max !== undefined) {
        return data.min <= data.max;
      }
      return true;
    },
    { message: "min must be <= max" }
  );

export const emailConfigSchema = z
  .object({
    pattern: z.literal("email").optional(),
  })
  .strict();

export const phoneConfigSchema = z
  .object({
    minLength: z.number().int().min(0).optional(),
    maxLength: z.number().int().min(0).optional(),
    pattern: safeRegex.optional(),
  })
  .strict()
  .refine(
    (data) => {
      if (data.minLength !== undefined && data.maxLength !== undefined) {
        return data.minLength <= data.maxLength;
      }
      return true;
    },
    { message: "minLength must be <= maxLength" }
  );

export const booleanConfigSchema = z.object({}).strict();

export const dateConfigSchema = z
  .object({
    minDate: z.string().optional(),
    maxDate: z.string().optional(),
  })
  .strict()
  .refine(
    (data) => {
      if (data.minDate !== undefined && isNaN(Date.parse(data.minDate))) {
        return false;
      }
      if (data.maxDate !== undefined && isNaN(Date.parse(data.maxDate))) {
        return false;
      }
      return true;
    },
    { message: "minDate and maxDate must be valid date strings" }
  )
  .refine(
    (data) => {
      if (data.minDate !== undefined && data.maxDate !== undefined) {
        return new Date(data.minDate) <= new Date(data.maxDate);
      }
      return true;
    },
    { message: "minDate must be <= maxDate" }
  );

export const singleSelectConfigSchema = z
  .object({
    options: z.array(z.string()).min(1, "At least one option is required"),
  })
  .strict();

export const multiSelectConfigSchema = z
  .object({
    options: z.array(z.string()).min(1, "At least one option is required"),
    maxSelections: z.number().int().min(1).optional(),
  })
  .strict()
  .refine(
    (data) => {
      if (data.maxSelections !== undefined) {
        return data.maxSelections <= data.options.length;
      }
      return true;
    },
    { message: "maxSelections must be <= number of options" }
  );

// ─── Config Schema Map ──────────────────────────────────

const configSchemaMap: Record<FormFieldType, z.ZodTypeAny> = {
  text: textConfigSchema,
  textarea: textareaConfigSchema,
  number: numberConfigSchema,
  email: emailConfigSchema,
  phone: phoneConfigSchema,
  boolean: booleanConfigSchema,
  date: dateConfigSchema,
  single_select: singleSelectConfigSchema,
  multi_select: multiSelectConfigSchema,
};

// ─── Validate Field Configuration ────────────────────────

interface FieldForConfigValidation {
  type: FormFieldType;
  validation: unknown;
}

/**
 * Validates a field's configuration (the JSONB validation object).
 * Returns the normalized config, or throws on invalid config.
 * Returns null if validation is empty/null/undefined.
 */
export function validateFieldConfiguration(
  field: FieldForConfigValidation
): Record<string, unknown> | null {
  if (
    field.validation === null ||
    field.validation === undefined
  ) {
    // Select/multi_select fields always require config with options
    if (field.type === "single_select" || field.type === "multi_select") {
      throw new Error(
        `Field type '${field.type}' requires a validation config with options`
      );
    }
    return null;
  }

  // If it's an empty object, treat as null (except for select types)
  if (
    typeof field.validation === "object" &&
    !Array.isArray(field.validation) &&
    Object.keys(field.validation as object).length === 0
  ) {
    if (field.type === "single_select" || field.type === "multi_select") {
      throw new Error(
        `Field type '${field.type}' requires a validation config with options`
      );
    }
    return null;
  }

  const schema = configSchemaMap[field.type];
  if (!schema) {
    throw new Error(`Unknown field type: ${field.type}`);
  }

  const result = schema.safeParse(field.validation);
  if (!result.success) {
    throw new Error(
      `Invalid validation config for field type '${field.type}': ${result.error.message}`
    );
  }

  return result.data as Record<string, unknown>;
}

// ─── Validate Answer ─────────────────────────────────────

interface FieldForAnswerValidation {
  type: FormFieldType;
  required: boolean;
  validation: unknown;
  label: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validates a string answer against a field's type and validation config.
 * Throws on validation failure.
 */
export function validateAnswer(
  field: FieldForAnswerValidation,
  answer: string
): void {
  // Required/optional handling
  if (answer === "" || answer === undefined || answer === null) {
    if (field.required) {
      throw new Error(`Field '${field.label}' is required`);
    }
    return; // Optional empty is valid
  }

  const config = field.validation as Record<string, unknown> | null;

  switch (field.type) {
    case "text":
    case "textarea": {
      if (config) {
        const minLength = config.minLength as number | undefined;
        const maxLength = config.maxLength as number | undefined;
        const pattern = config.pattern as string | undefined;

        if (minLength !== undefined && answer.length < minLength) {
          throw new Error(
            `Field '${field.label}' must be at least ${minLength} characters`
          );
        }
        if (maxLength !== undefined && answer.length > maxLength) {
          throw new Error(
            `Field '${field.label}' must be at most ${maxLength} characters`
          );
        }
        if (pattern !== undefined && !new RegExp(pattern).test(answer)) {
          throw new Error(
            `Field '${field.label}' does not match the required pattern`
          );
        }
      }
      break;
    }

    case "number": {
      const num = Number(answer);
      if (isNaN(num)) {
        throw new Error(
          `Field '${field.label}' must be a valid number`
        );
      }
      if (config) {
        const min = config.min as number | undefined;
        const max = config.max as number | undefined;
        if (min !== undefined && num < min) {
          throw new Error(`Field '${field.label}' must be at least ${min}`);
        }
        if (max !== undefined && num > max) {
          throw new Error(`Field '${field.label}' must be at most ${max}`);
        }
      }
      break;
    }

    case "email": {
      if (!EMAIL_REGEX.test(answer)) {
        throw new Error(`Field '${field.label}' must be a valid email address`);
      }
      break;
    }

    case "phone": {
      if (config) {
        const minLength = config.minLength as number | undefined;
        const maxLength = config.maxLength as number | undefined;
        const pattern = config.pattern as string | undefined;

        if (minLength !== undefined && answer.length < minLength) {
          throw new Error(
            `Field '${field.label}' must be at least ${minLength} characters`
          );
        }
        if (maxLength !== undefined && answer.length > maxLength) {
          throw new Error(
            `Field '${field.label}' must be at most ${maxLength} characters`
          );
        }
        if (pattern !== undefined && !new RegExp(pattern).test(answer)) {
          throw new Error(
            `Field '${field.label}' does not match the required pattern`
          );
        }
      }
      break;
    }

    case "boolean": {
      if (answer !== "true" && answer !== "false") {
        throw new Error(
          `Field '${field.label}' must be exactly "true" or "false"`
        );
      }
      break;
    }

    case "date": {
      const parsed = Date.parse(answer);
      if (isNaN(parsed)) {
        throw new Error(`Field '${field.label}' must be a valid date`);
      }
      if (config) {
        const minDate = config.minDate as string | undefined;
        const maxDate = config.maxDate as string | undefined;
        const answerDate = new Date(answer);
        if (minDate !== undefined && answerDate < new Date(minDate)) {
          throw new Error(
            `Field '${field.label}' must be on or after ${minDate}`
          );
        }
        if (maxDate !== undefined && answerDate > new Date(maxDate)) {
          throw new Error(
            `Field '${field.label}' must be on or before ${maxDate}`
          );
        }
      }
      break;
    }

    case "single_select": {
      if (!config || !Array.isArray(config.options)) {
        throw new Error(
          `Field '${field.label}' is misconfigured: missing options`
        );
      }
      const options = config.options as string[];
      if (!options.includes(answer)) {
        throw new Error(
          `Field '${field.label}' must be one of: ${options.join(", ")}`
        );
      }
      break;
    }

    case "multi_select": {
      if (!config || !Array.isArray(config.options)) {
        throw new Error(
          `Field '${field.label}' is misconfigured: missing options`
        );
      }
      const options = config.options as string[];
      let selected: string[];
      try {
        selected = JSON.parse(answer);
        if (!Array.isArray(selected)) throw new Error();
      } catch {
        throw new Error(
          `Field '${field.label}' must be a JSON-stringified array of strings`
        );
      }
      for (const val of selected) {
        if (!options.includes(val)) {
          throw new Error(
            `Field '${field.label}': "${val}" is not a valid option`
          );
        }
      }
      const maxSelections = config.maxSelections as number | undefined;
      if (maxSelections !== undefined && selected.length > maxSelections) {
        throw new Error(
          `Field '${field.label}' allows at most ${maxSelections} selections`
        );
      }
      break;
    }

    default:
      throw new Error(`Unknown field type: ${field.type}`);
  }
}

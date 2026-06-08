# Lost Changes Recovery Plan

This document records the features that were implemented earlier and are no longer present in the current codebase. It is intended to be a reconstruction guide for re-implementing the database schema, services, tRPC routes, validation system, and Google signup support.

Current baseline observed on 2026-06-08:

* `packages/database/schema.ts` exports only `users`.
* `packages/database/models/user.ts` exists.
* Form, field, answer, form service, submission service, and their tRPC routes are missing.
* `packages/trpc/server/trpc.ts` currently exposes only `publicProcedure`; authenticated middleware is missing.
* `packages/services/clients/google-oauth.ts` uses `google-auth-library`, but `packages/services/env.ts` does not define the Google OAuth env vars.
* `packages/services/user/index.ts` still logs password hashes in signin and should remove those logs.

No database schema changes are required beyond restoring the previously implemented V1 form-builder schema.

## Architecture Pattern

The intended architecture follows the existing user service pattern:

* Database tables live in `packages/database/models`.
* `packages/database/schema.ts` re-exports all table models for Drizzle.
* Business logic lives in `packages/services/<domain>`.
* Shared service Zod input/output models live in `packages/services/<domain>/model.ts`.
* tRPC route models re-export service models from `packages/trpc/server/routes/<domain>/model.ts`.
* tRPC procedures live in `packages/trpc/server/routes/<domain>/route.ts`.
* Service instances are registered in `packages/trpc/server/services/index.ts`.
* Routers are mounted in `packages/trpc/server/index.ts`.

Authenticated routes should use an `authenticatedProcedure` middleware in `packages/trpc/server/trpc.ts` that:

* Reads the auth cookie with `getAuthenticationCookie(ctx)`.
* Verifies the JWT through `userService.verifyAndDecodeUserToken(token)`.
* Adds `ctx.user = { id }`.

## Database Schema To Restore

### `forms`

Purpose: stores forms created by users.

Columns:

* `id uuid primary key defaultRandom`
* `secure_code varchar(255) unique nullable`
* `created_by uuid not null references users.id`
* `title varchar(255) not null`
* `description text nullable`
* `is_open_for_submission boolean not null default true`
* `created_at timestamp defaultNow`
* `updated_at timestamp $onUpdate`

Indexes:

* `forms_created_by_index` on `created_by`

Types:

* `SelectForm`
* `InsertForm`

### `form_field`

Purpose: stores field metadata and validation configuration.

Enum `form_field_type`:

* `text`
* `textarea`
* `number`
* `email`
* `phone`
* `boolean`
* `date`
* `single_select`
* `multi_select`

Columns:

* `id uuid primary key defaultRandom`
* `label varchar(255) not null`
* `type form_field_type not null`
* `required boolean not null default false`
* `placeholder text nullable`
* `validation jsonb nullable`
* `order_index numeric(20, 10) not null`
* `form_id uuid not null references forms.id on delete cascade`

Indexes and constraints:

* `form_field_form_id_index` on `form_id`
* `form_field_form_order_index_unique` unique on `(form_id, order_index)`

Types:

* `SelectFormField`
* `InsertFormField`

### `answer`

Purpose: stores submitted answers as strings.

Columns:

* `id uuid primary key defaultRandom`
* `form_field_id uuid not null references form_field.id on delete cascade`
* `answer text not null`
* `submitter_id uuid not null references users.id`

Indexes and constraints:

* `answer_form_field_id_index` on `form_field_id`
* `answer_submitter_id_index` on `submitter_id`
* `answer_form_field_submitter_unique` unique on `(form_field_id, submitter_id)`

Types:

* `SelectAnswer`
* `InsertAnswer`

### `schema.ts`

Should export:

```ts
export * from "./models/answer";
export * from "./models/form";
export * from "./models/form-field";
export * from "./models/user";
```

## Form Service To Restore

Files:

* `packages/services/form/model.ts`
* `packages/services/form/index.ts`
* `packages/services/form/validation.ts`
* `packages/trpc/server/routes/form/model.ts`
* `packages/trpc/server/routes/form/route.ts`

### Form Operations

`FormService` should expose:

* `createForm`
* `updateForm`
* `deleteForm`
* `getFormById`
* `getMyForms`
* `getFormForSubmission`
* `setFormSubmissionStatus`
* `updateFormSecureCode`

### Form Creation

Input:

* `userId`
* `secureCode?`
* `title`
* `description?`
* `isOpenForSubmission`
* `fields[]`

Field input:

* `label`
* `type`
* `required`
* `placeholder?`
* `validation?`
* `orderIndex`

Behavior:

* Must require at least one field.
* Must validate unique `orderIndex` values before insert.
* Must validate field configuration with `validateFieldConfiguration`.
* Must write the form and fields inside a transaction.
* Must return the created form with fields ordered by `orderIndex`.

### Form Update

Input:

* `userId`
* `id`
* form metadata
* `fields[]`

Behavior:

* Must require ownership: `forms.createdBy === userId`.
* Must validate unique field IDs when supplied.
* Must validate unique `orderIndex` values.
* Must validate every field config with `validateFieldConfiguration`.
* Must run form and field changes in a transaction.
* Existing field IDs should be preserved when supplied.
* New fields are inserted when no field ID is supplied.
* Existing fields omitted from the update payload are deleted.
* Existing field IDs must belong to that form.
* Reordering should avoid temporary unique constraint conflicts on `(form_id, order_index)` by moving existing retained fields to temporary negative order indexes before applying final values.

### Form Delete

Behavior:

* Must require ownership.
* Must delete the form in a transaction.
* Field and answer rows cascade via foreign keys.

### Owner Form Reads

`getFormById`:

* Authenticated.
* Requires ownership.
* Returns form with ordered fields.

`getMyForms`:

* Authenticated.
* Returns all forms created by the user, ordered by newest first.
* Includes ordered fields for each form.

### Public Render Form

`getFormForSubmission({ formId, secureCode })`:

* Public route.
* Loads form by `formId`.
* Checks `isOpenForSubmission`.
* Checks secure code privately inside the service:
  * If `form.secureCode` is null, no secure code is required.
  * If `form.secureCode` exists, input `secureCode` must match.
* Returns render-safe form data:
  * `id`
  * `title`
  * `description`
  * `isOpenForSubmission`
  * `fields`
* Must not return `secureCode` or `createdBy`.

### Owner Settings Helpers

`setFormSubmissionStatus`:

* Authenticated owner route.
* Opens or closes a form.

`updateFormSecureCode`:

* Authenticated owner route.
* Sets, changes, or clears `secureCode`.

## Strongly Typed Validation System To Restore

File:

* `packages/services/form/validation.ts`

The validator module should export:

* `validateAnswer(field, answer)`
* `validateFieldConfiguration(field)`
* Dedicated Zod schemas for each field type.

### Validation Storage

Database remains unchanged:

* `form_field.validation` remains `jsonb`.
* Drizzle returns validation as JavaScript object/unknown.
* Answers remain strings.
* Multi-select answers remain JSON-stringified arrays.

### Field Configuration Schemas

`text`:

* Optional `minLength`
* Optional `maxLength`
* Optional regex `pattern`
* `minLength <= maxLength`
* `pattern` must compile as `RegExp`

`textarea`:

* Same as `text`

`number`:

* Optional `min`
* Optional `max`
* `min <= max`

`email`:

* Optional `{ pattern: "email" }`

`phone`:

* Optional `minLength`
* Optional `maxLength`
* Optional regex `pattern`
* `minLength <= maxLength`
* `pattern` must compile as `RegExp`

`boolean`:

* Empty strict object

`date`:

* Optional `minDate`
* Optional `maxDate`
* Both must parse as valid dates.
* `minDate <= maxDate`

`single_select`:

* Required `options: string[]`
* At least one option.

`multi_select`:

* Required `options: string[]`
* Optional `maxSelections`
* `maxSelections <= options.length`

### Answer Validation

`validateAnswer(field, answer)` must preserve existing behavior:

* Required fields reject empty strings.
* Optional fields accept empty strings.
* Number answers must parse with `Number(answer)`.
* Email answers must match a basic email regex.
* Boolean answers must be exactly `"true"` or `"false"`.
* Date answers must parse as valid dates.
* Single select answer must be in `options`.
* Multi select answer must be a JSON-stringified string array.
* Multi select values must be in `options`.

New answer rules:

* `text` and `textarea` enforce regex `pattern` when present.
* `date` enforces `minDate` and `maxDate`.
* `multi_select` enforces `maxSelections`.

### Service Integration

`FormService`:

* Validate field configuration during `createForm`.
* Validate field configuration during `updateForm`.
* Store normalized validation object in JSONB.
* Store `null` for empty validation objects.

`SubmissionService`:

* Must not contain field-specific validation logic.
* Should only map submitted answers to fields and call `validateAnswer(field, answer)`.

## Submission Service To Restore

Files:

* `packages/services/submission/model.ts`
* `packages/services/submission/index.ts`
* `packages/trpc/server/routes/submission/model.ts`
* `packages/trpc/server/routes/submission/route.ts`

### Submission Operations

`SubmissionService` should expose:

* `submitForm`
* `checkUserSubmission`
* `getSubmissionCount`
* `getMyFormResponse`
* `getFormResponses`
* `getBasicSubmissionAnalytics`

### Submit Form

Route:

* Authenticated only.

Input:

* `userId` from auth context
* `formId`
* `secureCode?`
* `answers[]`

Answer input:

* `formFieldId`
* `answer`

Behavior:

* Transactional.
* Load form.
* Check form exists.
* Check form is open.
* Check secure code if the form has one.
* Load form fields.
* Ensure every answer belongs to the form.
* Reject duplicate answers for the same field.
* Ensure every required field has an answer.
* Validate each answer through `validateAnswer`.
* Check user has not already submitted that form.
* Insert answers as strings.
* Return inserted answers.

Single submission rule:

* Since V1 intentionally has no `submission` table, a submission is inferred as a set of answers by one `submitter_id` across a form's fields.
* Duplicate submission check loads answers for that form's fields and checks whether any existing answer has `submitterId === userId`.
* The database additionally enforces `(form_field_id, submitter_id)` uniqueness.

### Check User Submission

`checkUserSubmission({ formId })`:

* Authenticated.
* Returns `{ formId, userId, hasSubmitted }`.
* Does not require form ownership.

### Get My Form Response

`getMyFormResponse({ formId })`:

* Authenticated.
* Returns the current user's own grouped answers for a form.
* Does not require ownership.
* Empty response is `{ submitterId: userId, answers: [] }`.

### Get Form Responses

`getFormResponses({ formId })`:

* Authenticated owner route.
* Requires `forms.createdBy === userId`.
* Returns grouped responses by submitter.

Response shape:

```ts
{
  submitterId: string;
  answers: Array<{
    id: string;
    formFieldId: string;
    label: string;
    type: FormFieldType;
    answer: string;
  }>;
}
```

### Submission Count

`getSubmissionCount({ formId })`:

* Authenticated owner route.
* Counts distinct `submitterId` values among answers for the form's fields.

### Basic Analytics

`getBasicSubmissionAnalytics({ formId })`:

* Authenticated owner route.
* Returns:
  * `formId`
  * `submissionCount`
  * per-field `answerCount`
  * per-field `valueCounts`

No deep analytics were implemented. No cross-form analytics, charts, statistical summaries, date bucketing, or numeric aggregations.

## tRPC Wiring To Restore

### `packages/trpc/server/services/index.ts`

Should instantiate:

```ts
export const formService = new FormService();
export const submissionService = new SubmissionService();
export const userService = new UserService();
```

### `packages/trpc/server/index.ts`

Should mount:

```ts
export const serverRouter = router({
  health: healthRouter,
  auth: authRouter,
  form: formRouter,
  submission: submissionRouter,
});
```

### Form Router

Routes:

* `form.createForm`
* `form.updateForm`
* `form.deleteForm`
* `form.getFormById`
* `form.getMyForms`
* `form.getFormForSubmission`
* `form.setFormSubmissionStatus`
* `form.updateFormSecureCode`

Auth:

* All are authenticated except `getFormForSubmission`.

### Submission Router

Routes:

* `submission.submitForm`
* `submission.checkUserSubmission`
* `submission.getSubmissionCount`
* `submission.getMyFormResponse`
* `submission.getFormResponses`
* `submission.getBasicSubmissionAnalytics`

Auth:

* All submission routes are authenticated.

## Current Small Errors To Correct Later

These were observed in the current codebase, but not changed in this documentation pass.

### Password Hash Logging

In `packages/services/user/index.ts`, `signinUserWithEmailAndPassword` logs:

```ts
console.log(hash);
console.log(existingUser.password);
```

Remove both logs before continuing auth work.

### Missing Auth Middleware

`packages/trpc/server/trpc.ts` currently imports `TRPCError` but does not define `authenticatedProcedure`.

Restore authenticated middleware before adding form/submission routes.

### Google OAuth Env Mismatch

`packages/services/clients/google-oauth.ts` references:

* `GOOGLE_OAUTH_CLIENT_ID`
* `GOOGLE_OAUTH_CLIENT_SECRET`
* `GOOGLE_OAUTH_REDIRECT_URI`

But `packages/services/env.ts` currently defines only:

* `JWT_SECRET`

This causes TypeScript/env validation issues.

## Google Signup Without Third-Party Library

Current file `packages/services/clients/google-oauth.ts` uses `google-auth-library`. The requested future implementation should avoid that third-party OAuth client and use built-in `fetch`/Web Crypto or Node crypto.

### Required Environment Variables

Add to `packages/services/env.ts`:

* `GOOGLE_OAUTH_CLIENT_ID`
* `GOOGLE_OAUTH_CLIENT_SECRET`
* `GOOGLE_OAUTH_REDIRECT_URI`
* `GOOGLE_OAUTH_AUTH_URL` default or constant: `https://accounts.google.com/o/oauth2/v2/auth`
* `GOOGLE_OAUTH_TOKEN_URL` default or constant: `https://oauth2.googleapis.com/token`
* `GOOGLE_OAUTH_JWKS_URL` default or constant: `https://www.googleapis.com/oauth2/v3/certs`
* `GOOGLE_OAUTH_ISSUER` default or constant: `https://accounts.google.com`

### Required User Schema Support

The current `users` table can support Google signup minimally:

* `email`
* `emailVerified`
* `fullName`
* `profileImageUrl`
* nullable `password`
* nullable `salt`

No schema change is strictly required for basic Google signup.

Recommended future schema improvement:

* Add `auth_provider` or `google_sub` if provider identity must be tracked robustly.
* Without `google_sub`, account linking is email-based.

### Google Auth Flow

1. Backend route generates Google authorization URL.
2. Include:
   * `client_id`
   * `redirect_uri`
   * `response_type=code`
   * `scope=openid email profile`
   * `state`
   * `nonce`
   * `prompt=select_account`
3. Store `state` and `nonce` in secure, HTTP-only cookies.
4. Google redirects back with `code` and `state`.
5. Backend verifies returned `state`.
6. Backend exchanges `code` for tokens using `fetch`:

```ts
await fetch("https://oauth2.googleapis.com/token", {
  method: "POST",
  headers: { "content-type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({
    code,
    client_id,
    client_secret,
    redirect_uri,
    grant_type: "authorization_code",
  }),
});
```

7. Backend verifies the returned `id_token`.
8. Backend creates or finds user.
9. Backend issues the app JWT and auth cookie.

### ID Token Verification Without Third-Party Library

Implement JWT verification manually:

* Split `id_token` into header, payload, signature.
* Decode header and payload from base64url.
* Fetch Google's JWKS from `https://www.googleapis.com/oauth2/v3/certs`.
* Find JWK by `kid`.
* Convert JWK to a public key using Node `crypto.createPublicKey({ key: jwk, format: "jwk" })`.
* Verify signature with `crypto.verify("RSA-SHA256", signingInput, publicKey, signature)`.
* Validate claims:
  * `iss` is `https://accounts.google.com` or `accounts.google.com`
  * `aud` equals `GOOGLE_OAUTH_CLIENT_ID`
  * `exp` is in the future
  * `iat` is sane
  * `nonce` matches cookie value
  * `email_verified === true`
* Extract:
  * `sub`
  * `email`
  * `email_verified`
  * `name`
  * `picture`

### UserService Methods To Add

Add methods similar to:

* `generateGoogleOAuthUrl()`
* `signInWithGoogleAuthorizationCode(payload)`
* `findOrCreateGoogleUser(profile)`
* `verifyGoogleIdToken(idToken, nonce)`

Account behavior:

* If user exists by email:
  * Update `emailVerified = true`.
  * Update `profileImageUrl` if absent or changed.
  * Do not overwrite password/salt.
* If user does not exist:
  * Create user with `fullName`, `email`, `emailVerified = true`, `profileImageUrl`.
  * Leave `password` and `salt` null.
* Issue app JWT with current `generateUserToken`.

### Auth tRPC Routes To Add

Add under auth router:

* `getGoogleOAuthUrl`
* `signInWithGoogle`

Depending on frontend design, `signInWithGoogle` may accept:

* `code`
* `state`

Cookie handling:

* `getGoogleOAuthUrl` sets `state` and `nonce` cookies.
* `signInWithGoogle` clears those cookies after successful verification.
* `signInWithGoogle` sets the existing authentication cookie.

### Security Requirements

* Use secure, HTTP-only cookies for auth, state, and nonce.
* Use SameSite Lax or Strict depending on frontend callback architecture.
* Remove password hash logs before testing auth flows.
* Do not trust `email` from token until signature and claims are verified.
* Do not use the existing `google-auth-library` client if the requirement is no third-party OAuth library.

## Suggested Rebuild Order

1. Restore database form/field/answer models and `schema.ts` exports.
2. Run `pnpm run db:generate`, but do not migrate until SQL is reviewed.
3. Restore `authenticatedProcedure`.
4. Restore form validation module.
5. Restore form service and routes.
6. Restore submission service and routes.
7. Run focused TypeScript checks:
   * `./packages/trpc/node_modules/.bin/tsc -p packages/trpc/tsconfig.json --noEmit`
   * focused services check for form/submission files
8. Remove password hash logs.
9. Implement Google signup without `google-auth-library`.


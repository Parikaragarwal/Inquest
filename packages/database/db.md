# Form Builder SaaS - Database Design V1

## Design Philosophy

This schema is optimized for:

* Simplicity
* Learning system design
* Dynamic form creation
* Easy schema evolution
* Low operational complexity

It is NOT optimized for:

* Multiple submissions per user
* Draft submissions
* Submission version history
* Enterprise-scale analytics
* Complex workflow states

These features may be introduced in future versions.

---

# Domain Rules

## User Rules

* A user may create multiple forms.
* A user may submit a form at most once.
* A user may submit multiple different forms.

## Form Rules

* A form belongs to exactly one creator.
* A form contains multiple fields.
* A form may be opened or closed for submissions.
* Closed forms reject new submissions.

## Field Rules

* A field belongs to exactly one form.
* A field has a single source of truth for its metadata.
* Field labels may be modified.
* Validation rules may be modified.
* Field type determines rendering and validation behavior.

## Answer Rules

* Every answer belongs to one field.
* Every answer belongs to one submitting user.
* Answers are stored as strings.
* Field metadata determines how answers should be interpreted.
* Answers are inserted only after backend validation succeeds.

---

# Tables

## users

Purpose:
Stores application users.

Fields:

* id (PK)
* fullName
* email
* emailVerified
* profileImageUrl
* password
* salt
* createdAt
* updatedAt

Relationships:

* One User -> Many Forms
* One User -> Many Answers

Notes:

* Email should be unique.
* Password should contain only a hash.
* Verify whether salt is required by chosen hashing library.

---

## forms

Purpose:
Represents a form created by a user.

Fields:

* id (PK)
* secureCode (nullable)
* createdBy (FK -> users.id)
* title
* description
* isOpenForSubmission
* createdAt
* updatedAt

Relationships:

* One Form -> Many Fields

Notes:

* secureCode enables private forms.
* If secureCode is null, form is public.
* isOpenForSubmission controls whether new responses are accepted.

---

## form_field

Purpose:
Stores field definitions and metadata.

Fields:

* id (PK)
* label
* type
* required
* placeholder
* validation (JSONB)
* form_id (FK -> forms.id)

Relationships:

* One Form -> Many Fields
* One Field -> Many Answers

Notes:

Field metadata is the single source of truth.

Example validation objects:

Number:

{
"min": 0,
"max": 100
}

Text:

{
"minLength": 3,
"maxLength": 50
}

Select:

{
"options": [
"React",
"Vue",
"Angular"
]
}

Email:

{
"pattern": "email"
}

The frontend uses this metadata to render the form.

The backend uses this metadata to validate submissions.

---

## answer

Purpose:
Stores submitted answers.

Fields:

* id (PK)
* form_field_id (FK -> form_field.id)
* answer
* submitter_id (FK -> users.id)

Relationships:

* Many Answers -> One Field
* Many Answers -> One User

Notes:

Answers are stored as strings.

Examples:

Age:

"21"

Name:

"Parikar"

Email:

"[parikar@example.com](mailto:parikar@example.com)"

The field type determines how values are interpreted.

Example:

Field Type = Number

Stored Value:

"21"

Application Interpretation:

Number("21")

---

# Validation Flow

1. User requests form.
2. Backend loads form fields.
3. Frontend renders fields using metadata.
4. User submits answers.
5. Frontend performs validation.
6. Backend performs validation again.
7. Transaction begins.
8. All answers inserted.
9. Transaction committed.

If validation fails:

* No answers are inserted.

---

# Data Integrity Strategy

Database Responsibilities:

* Foreign keys
* Uniqueness constraints
* Referential integrity

Backend Responsibilities:

* Validation
* Submission completeness
* Form status checks
* Authorization
* Business rules

Frontend Responsibilities:

* User experience
* Instant validation feedback
* Form rendering

---

# Current Scope Decisions

Accepted:

* Dynamic forms
* Dynamic validations
* Single submission per user
* String answer storage
* JSONB field validation

Rejected For V1:

* File uploads
* Draft submissions
* Submission editing
* Submission version history
* Multiple attempts
* Advanced analytics
* Workflow states

---

# Future Migration Notes

Reconsider introducing a Submission table if any of the following are added:

* Multiple submissions per user
* Draft support
* Submission status
* Approval workflows
* Submission history
* Edit tracking

Current architecture intentionally avoids a Submission entity to reduce complexity for V1.

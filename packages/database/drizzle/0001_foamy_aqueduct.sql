CREATE TYPE "public"."form_field_type" AS ENUM('text', 'textarea', 'number', 'email', 'phone', 'boolean', 'date', 'single_select', 'multi_select');--> statement-breakpoint
CREATE TABLE "answer" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"form_field_id" uuid NOT NULL,
	"answer" text NOT NULL,
	"submitter_id" uuid NOT NULL,
	CONSTRAINT "answer_form_field_submitter_unique" UNIQUE("form_field_id","submitter_id")
);
--> statement-breakpoint
CREATE TABLE "forms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"secure_code" varchar(255),
	"created_by" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"is_open_for_submission" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp,
	CONSTRAINT "forms_secure_code_unique" UNIQUE("secure_code")
);
--> statement-breakpoint
CREATE TABLE "form_field" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"label" varchar(255) NOT NULL,
	"type" "form_field_type" NOT NULL,
	"required" boolean DEFAULT false NOT NULL,
	"placeholder" text,
	"validation" jsonb,
	"order_index" numeric(20, 10) NOT NULL,
	"form_id" uuid NOT NULL,
	CONSTRAINT "form_field_form_order_index_unique" UNIQUE("form_id","order_index")
);
--> statement-breakpoint
ALTER TABLE "answer" ADD CONSTRAINT "answer_form_field_id_form_field_id_fk" FOREIGN KEY ("form_field_id") REFERENCES "public"."form_field"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "answer" ADD CONSTRAINT "answer_submitter_id_users_id_fk" FOREIGN KEY ("submitter_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forms" ADD CONSTRAINT "forms_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_field" ADD CONSTRAINT "form_field_form_id_forms_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."forms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "answer_form_field_id_index" ON "answer" USING btree ("form_field_id");--> statement-breakpoint
CREATE INDEX "answer_submitter_id_index" ON "answer" USING btree ("submitter_id");--> statement-breakpoint
CREATE INDEX "forms_created_by_index" ON "forms" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "form_field_form_id_index" ON "form_field" USING btree ("form_id");
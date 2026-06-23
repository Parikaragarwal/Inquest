CREATE TABLE "otps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"otp" varchar(6) NOT NULL,
	"purpose" varchar(50) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "otps_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "answer" ADD COLUMN "created_at" timestamp DEFAULT now();
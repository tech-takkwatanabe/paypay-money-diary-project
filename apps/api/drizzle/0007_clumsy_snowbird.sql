ALTER TABLE "categories" ADD COLUMN "is_other" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "default_categories" ADD COLUMN "is_other" boolean DEFAULT false NOT NULL;
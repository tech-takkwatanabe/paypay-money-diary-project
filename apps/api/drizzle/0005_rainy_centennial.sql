CREATE TABLE "default_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(50) NOT NULL,
	"color" varchar(7) NOT NULL,
	"icon" varchar(50),
	"display_order" integer DEFAULT 100 NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "default_categories_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "default_category_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"keyword" varchar(100) NOT NULL,
	"default_category_id" uuid NOT NULL,
	"priority" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "default_category_rules_keyword_unique" UNIQUE("keyword")
);
--> statement-breakpoint
DROP INDEX "unique_system_category";--> statement-breakpoint
ALTER TABLE "categories" ALTER COLUMN "user_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "categories" ALTER COLUMN "display_order" SET DEFAULT 100;--> statement-breakpoint
ALTER TABLE "category_rules" ALTER COLUMN "user_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "default_category_rules" ADD CONSTRAINT "default_category_rules_default_category_id_default_categories_id_fk" FOREIGN KEY ("default_category_id") REFERENCES "public"."default_categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_categories_user" ON "categories" USING btree ("user_id");
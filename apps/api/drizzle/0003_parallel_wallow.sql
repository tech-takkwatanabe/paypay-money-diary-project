CREATE TABLE "budgets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" char(36) NOT NULL,
	"category_id" uuid,
	"amount" integer NOT NULL,
	"year" integer NOT NULL,
	"month" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_budget" UNIQUE("user_id","category_id","year","month")
);
--> statement-breakpoint
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_user_id_users_uuid_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("uuid") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "unique_system_category" ON "categories" USING btree ("name") WHERE "categories"."user_id" is null;
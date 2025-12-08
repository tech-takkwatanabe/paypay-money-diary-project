CREATE INDEX "idx_expenses_user_date" ON "expenses" USING btree ("user_id","transaction_date");--> statement-breakpoint
CREATE INDEX "idx_expenses_category" ON "expenses" USING btree ("user_id","category_id");--> statement-breakpoint
CREATE INDEX "idx_expenses_merchant" ON "expenses" USING btree ("user_id","merchant");
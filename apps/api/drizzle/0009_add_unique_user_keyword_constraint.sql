-- Remove duplicate (user_id, keyword) pairs, keeping the most recent
DELETE FROM category_rules
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id, keyword) id
  FROM category_rules
  ORDER BY user_id, keyword, created_at DESC
);
--> statement-breakpoint
-- Add unique constraint on category_rules table for (user_id, keyword) pair
ALTER TABLE category_rules
ADD CONSTRAINT unique_user_keyword UNIQUE (user_id, keyword);

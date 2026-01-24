-- Add unique constraint on category_rules table for (user_id, keyword) pair
ALTER TABLE category_rules
ADD CONSTRAINT unique_user_keyword UNIQUE (user_id, keyword);

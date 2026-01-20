-- Fix: Set is_other = true for all 'その他' categories
UPDATE categories SET is_other = true WHERE name = 'その他' AND is_other = false;
UPDATE default_categories SET is_other = true WHERE name = 'その他' AND is_other = false;

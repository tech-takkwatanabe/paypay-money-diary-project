-- Fix: Set is_other = true for all 'その他' categories and normalize display_order
UPDATE categories
SET is_other = true,
    display_order = 9999
WHERE name = 'その他';

UPDATE default_categories
SET is_other = true,
    display_order = 9999
WHERE name = 'その他';

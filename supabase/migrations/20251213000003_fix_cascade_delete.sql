
-- Fix Foreign Key constraints to allow deleting users via Supabase Dashboard
-- This ensures that when a user is deleted from auth.users, their data is also removed automatically.

-- 1. Fix user_manga_settings
ALTER TABLE user_manga_settings
DROP CONSTRAINT IF EXISTS user_manga_settings_user_id_fkey;

ALTER TABLE user_manga_settings
ADD CONSTRAINT user_manga_settings_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;

-- 2. Fix notifications (if it exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
        ALTER TABLE notifications
        DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;

        ALTER TABLE notifications
        ADD CONSTRAINT notifications_user_id_fkey
        FOREIGN KEY (user_id)
        REFERENCES auth.users(id)
        ON DELETE CASCADE;
    END IF;
END $$;

-- 3. Fix issue_reports (if it exists, assuming table name based on route)
-- Note: You might need to check the actual table name for reports if created previously.
-- Assuming 'issue_reports' or similar if you added that feature.

-- Add reading_status to user_manga_settings
ALTER TABLE user_manga_settings 
ADD COLUMN reading_status VARCHAR(20) DEFAULT 'reading' 
CHECK (reading_status IN ('reading', 'completed', 'plan_to_read', 'dropped', 'on_hold'));

-- Update existing rows to have 'reading' as default
UPDATE user_manga_settings SET reading_status = 'reading' WHERE reading_status IS NULL;

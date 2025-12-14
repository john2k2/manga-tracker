
-- Add issue_type to issue_reports
alter table issue_reports 
add column issue_type varchar check (issue_type in ('wrong_title', 'wrong_cover', 'missing_chapters', 'broken_link', 'other'));

-- Update existing rows if any (default to 'other')
update issue_reports set issue_type = 'other' where issue_type is null;

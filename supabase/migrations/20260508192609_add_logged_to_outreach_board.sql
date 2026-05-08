-- Add logged_to_outreach column to outreach_board table
ALTER TABLE outreach_board ADD COLUMN logged_to_outreach BOOLEAN DEFAULT FALSE;
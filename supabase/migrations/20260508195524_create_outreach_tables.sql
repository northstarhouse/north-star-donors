-- Create outreach_entries table
CREATE TABLE IF NOT EXISTS outreach_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  area TEXT NOT NULL,
  title TEXT NOT NULL,
  contact TEXT,
  linked_donor_id UUID,
  date DATE,
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'no_response', 'follow_up')),
  notes TEXT,
  submitted_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create outreach_board table
CREATE TABLE IF NOT EXISTS outreach_board (
  id SERIAL PRIMARY KEY,
  area TEXT NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'no_response', 'follow_up')),
  date DATE,
  logged_to_outreach BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create outreach_comments table
CREATE TABLE IF NOT EXISTS outreach_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID NOT NULL REFERENCES outreach_entries(id) ON DELETE CASCADE,
  author TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS outreach_entries_area_idx ON outreach_entries(area);
CREATE INDEX IF NOT EXISTS outreach_entries_created_at_idx ON outreach_entries(created_at DESC);
CREATE INDEX IF NOT EXISTS outreach_board_area_idx ON outreach_board(area);
CREATE INDEX IF NOT EXISTS outreach_board_created_at_idx ON outreach_board(created_at DESC);
CREATE INDEX IF NOT EXISTS outreach_comments_entry_id_idx ON outreach_comments(entry_id);

-- Enable RLS
ALTER TABLE outreach_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE outreach_board ENABLE ROW LEVEL SECURITY;
ALTER TABLE outreach_comments ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "anon read outreach_entries" ON outreach_entries FOR SELECT TO anon USING (true);
CREATE POLICY "anon insert outreach_entries" ON outreach_entries FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon update outreach_entries" ON outreach_entries FOR UPDATE TO anon USING (true);
CREATE POLICY "anon delete outreach_entries" ON outreach_entries FOR DELETE TO anon USING (true);

CREATE POLICY "anon read outreach_board" ON outreach_board FOR SELECT TO anon USING (true);
CREATE POLICY "anon insert outreach_board" ON outreach_board FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon update outreach_board" ON outreach_board FOR UPDATE TO anon USING (true);
CREATE POLICY "anon delete outreach_board" ON outreach_board FOR DELETE TO anon USING (true);

CREATE POLICY "anon read outreach_comments" ON outreach_comments FOR SELECT TO anon USING (true);
CREATE POLICY "anon insert outreach_comments" ON outreach_comments FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon update outreach_comments" ON outreach_comments FOR UPDATE TO anon USING (true);
CREATE POLICY "anon delete outreach_comments" ON outreach_comments FOR DELETE TO anon USING (true);
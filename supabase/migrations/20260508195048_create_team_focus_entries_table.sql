-- Create team focus entries table
CREATE TABLE IF NOT EXISTS team_focus_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member TEXT NOT NULL,
  section TEXT NOT NULL CHECK (section IN ('current', 'completed')),
  content TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  due_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS team_focus_entries_member_idx ON team_focus_entries(member);
CREATE INDEX IF NOT EXISTS team_focus_entries_section_idx ON team_focus_entries(section);
CREATE INDEX IF NOT EXISTS team_focus_entries_created_at_idx ON team_focus_entries(created_at DESC);

-- Enable RLS
ALTER TABLE team_focus_entries ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "anon read" ON team_focus_entries FOR SELECT TO anon USING (true);
CREATE POLICY "anon insert" ON team_focus_entries FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon update" ON team_focus_entries FOR UPDATE TO anon USING (true);
CREATE POLICY "anon delete" ON team_focus_entries FOR DELETE TO anon USING (true);
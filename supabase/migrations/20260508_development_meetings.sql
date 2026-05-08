-- Development Meetings table
CREATE TABLE IF NOT EXISTS development_meetings (
  id        bigint generated always as identity primary key,
  meeting_date date not null,
  meeting_time text,
  agenda    text,
  notes     text,
  files     jsonb default '[]'::jsonb,
  created_at timestamptz default now()
);

ALTER TABLE development_meetings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon read"   ON development_meetings FOR SELECT TO anon USING (true);
CREATE POLICY "anon insert" ON development_meetings FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon update" ON development_meetings FOR UPDATE TO anon USING (true);
CREATE POLICY "anon delete" ON development_meetings FOR DELETE TO anon USING (true);

-- Storage bucket for meeting file attachments
-- Run this only if the bucket doesn't exist yet
INSERT INTO storage.buckets (id, name, public)
VALUES ('meeting-files', 'meeting-files', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "anon upload"  ON storage.objects FOR INSERT TO anon WITH CHECK (bucket_id = 'meeting-files');
CREATE POLICY "anon read"    ON storage.objects FOR SELECT TO anon USING (bucket_id = 'meeting-files');
CREATE POLICY "anon delete"  ON storage.objects FOR DELETE TO anon USING (bucket_id = 'meeting-files');

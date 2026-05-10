import ProtectedHtmlDocumentLauncher from '@/components/ProtectedHtmlDocumentLauncher'

export default function PostMeetingBriefPage() {
  return (
    <ProtectedHtmlDocumentLauncher
      slug="post-meeting-brief-2026-05-07"
      fallbackTitle="Post-meeting brief - May 7, 2026"
      backHref="/"
      backLabel="Development Dashboard"
      eyebrow="Protected meeting brief"
      description="This page loads the May 7 post-meeting brief from Supabase after the app password has been accepted."
      warning="Internal post-meeting brief for development and outreach coordination."
    />
  )
}

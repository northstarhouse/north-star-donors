import ProtectedHtmlDocumentLauncher from '@/components/ProtectedHtmlDocumentLauncher'

export default function DonorAppDevelopmentMeetingBriefPage() {
  return (
    <ProtectedHtmlDocumentLauncher
      slug="donor-app-development-2026-05-14"
      fallbackTitle="Donor app development brief - May 14, 2026"
      backHref="/meetings/"
      backLabel="Development Meetings"
      eyebrow="Protected meeting brief"
      description="This page loads the May 14 donor app development brief from Supabase after the app password has been accepted."
      warning="Internal meeting brief for development and outreach coordination."
    />
  )
}

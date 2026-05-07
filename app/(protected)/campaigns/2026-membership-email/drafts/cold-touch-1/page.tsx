import ProtectedDocumentPage from '@/components/ProtectedDocumentPage'

export default function ColdTouchOneDraftPage() {
  return (
    <ProtectedDocumentPage
      slug="2026-membership-email-cold-touch-1"
      fallbackTitle="Cold Touch 1 Email Draft"
      backHref="/campaigns/2026-membership-email/"
      backLabel="Membership Campaign"
      eyebrow="Protected email draft"
      description="This page loads the Cold cohort Touch 1 email draft from Supabase after the app password has been accepted."
      warning="Draft email preview. Review copy and sender details before creating a production Constant Contact campaign."
    />
  )
}

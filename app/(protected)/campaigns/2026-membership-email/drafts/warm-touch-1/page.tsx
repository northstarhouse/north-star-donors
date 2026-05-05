import ProtectedCampaignDocumentPage from '../../ProtectedCampaignDocumentPage'

export default function WarmTouchOneDraftPage() {
  return (
    <ProtectedCampaignDocumentPage
      slug="2026-membership-email-warm-touch-1"
      fallbackTitle="Warm Touch 1 Email Draft"
      backHref="/campaigns/2026-membership-email/"
      backLabel="Membership Campaign"
      eyebrow="Protected email draft"
      description="This page loads the Warm cohort Touch 1 email draft from Supabase after the app password has been accepted."
      warning="Draft email preview. Review copy and sender details before creating a production Constant Contact campaign."
    />
  )
}

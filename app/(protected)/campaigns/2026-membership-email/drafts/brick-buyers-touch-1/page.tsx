import ProtectedCampaignDocumentPage from '../../ProtectedCampaignDocumentPage'

export default function BrickBuyersTouchOneDraftPage() {
  return (
    <ProtectedCampaignDocumentPage
      slug="2026-membership-email-brick-buyers-touch-1"
      fallbackTitle="Brick Buyers Touch 1 Email Draft"
      backHref="/campaigns/2026-membership-email/"
      backLabel="Membership Campaign"
      eyebrow="Protected email draft"
      description="This page loads the Brick Buyers cohort Touch 1 email draft from Supabase after the app password has been accepted."
      warning="Draft email preview. Review copy and sender details before creating a production Constant Contact campaign."
    />
  )
}

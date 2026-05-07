import ProtectedDocumentPage from '@/components/ProtectedDocumentPage'

export default function MembershipCampaignOverviewPage() {
  return (
    <ProtectedDocumentPage
      slug="2026-membership-email"
      fallbackTitle="2026 Membership Email Campaign"
      description="This page loads the campaign overview from Supabase after the app password has been accepted."
      warning="Draft operating overview. This is not final production copy and does not authorize a send."
    />
  )
}

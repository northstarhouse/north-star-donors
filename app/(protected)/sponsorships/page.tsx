import ProtectedDocumentPage from '@/components/ProtectedDocumentPage'

export default function SponsorshipPlanOverviewPage() {
  return (
    <ProtectedDocumentPage
      slug="sponsorship-plan"
      fallbackTitle="Sponsorship Plan"
      description="This page loads the sponsorship plan overview from Supabase after the app password has been accepted."
      warning="Internal planning overview. This is not final sponsor-facing copy."
      actions={[
        {
          href: '/sponsorships/packet/',
          label: 'Open Sponsorship Packet V1',
        },
      ]}
    />
  )
}

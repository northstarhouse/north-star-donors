import ProtectedDocumentPage from '@/components/ProtectedDocumentPage'

export default function SponsorshipPacketPage() {
  return (
    <ProtectedDocumentPage
      slug="sponsorship-packet-v1"
      fallbackTitle="Sponsorship Packet V1"
      backHref="/sponsorships/"
      backLabel="Sponsorship Plan"
      eyebrow="Protected packet draft"
      description="This page loads the designed sponsorship packet from Supabase after the app password has been accepted."
      warning="Packet draft for internal review. This is not final public sponsor-facing copy until approved."
    />
  )
}

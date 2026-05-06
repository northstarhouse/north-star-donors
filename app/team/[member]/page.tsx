import TeamMemberClient from './TeamMemberClient'

const MEMBERS = ['kaelen', 'haley', 'derek']

export function generateStaticParams() {
  return MEMBERS.map(member => ({ member }))
}

export default async function TeamMemberPage({ params }: { params: Promise<{ member: string }> }) {
  const { member } = await params
  return <TeamMemberClient member={member} />
}

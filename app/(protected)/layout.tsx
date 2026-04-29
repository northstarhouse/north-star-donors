import RequireAuthStatic from '@/components/RequireAuthStatic'

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return <RequireAuthStatic>{children}</RequireAuthStatic>
}

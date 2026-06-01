import AdminLayoutClient from './layout-client'

export const metadata = {
  title: { default: 'Admin Panel | GlowLux', template: '%s | GlowLux Admin' }
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminLayoutClient>{children}</AdminLayoutClient>
}

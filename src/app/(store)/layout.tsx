import Navbar from '@/components/store/navbar'
import Footer from '@/components/store/footer'

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col luxury-gradient">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}

import { ReactNode, useState } from 'react'
import Sidebar from './Sidebar'
import Header from './Header'
import { Menu } from 'lucide-react'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Floating Hamburger Button - Mobile Only */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="lg:hidden fixed top-6 left-6 z-40 w-12 h-12 bg-empire-600 text-white rounded-full shadow-lg hover:bg-empire-700 transition-all flex items-center justify-center"
      >
        <Menu size={20} />
      </button>

      <div className="lg:ml-70">
        <Header />
        <main className="min-h-screen">
          {children}
        </main>
      </div>
    </div>
  )
}
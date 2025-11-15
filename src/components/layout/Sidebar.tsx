import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  FolderOpen,
  Users,
  DollarSign,
  Target,
  Settings,
  HelpCircle,
  LogOut,
  X
} from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: FolderOpen, label: 'Projects', path: '/projects' },
  { icon: Users, label: 'Leads', path: '/leads' },
  { icon: DollarSign, label: 'Finance', path: '/finance' },
  { icon: Target, label: 'Goals', path: '/goals' },
  { icon: Settings, label: 'Settings', path: '/settings' },
]

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation()
  const { logout } = useAuth()

  const handleLogout = () => {
    logout()
  }

  return (
    <>
      {/* Backdrop for mobile */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.div
        initial={false}
        animate={{ x: 0 }}
        className="hidden lg:flex fixed left-0 top-0 h-screen w-70 bg-white border-r border-gray-200 flex-col z-auto"
      >
        <div className="p-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-empire-600 to-gold-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">B</span>
            </div>
            <span className="text-xl font-semibold text-gray-800">Blox</span>
          </div>
        </div>

        <nav className="flex-1 px-4">
          <div className="space-y-2">
            <div className="text-xs font-medium text-gray-400 uppercase tracking-wider px-3 mb-4">
              MENU
            </div>
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-3 py-3 rounded-xl transition-all duration-200 ${
                  location.pathname === item.path
                    ? 'bg-empire-50 text-empire-700 border-l-4 border-empire-600 shadow-md'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                }`}
              >
                <item.icon size={20} />
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
          </div>

          <div className="mt-8 space-y-2">
            <div className="text-xs font-medium text-gray-400 uppercase tracking-wider px-3 mb-4">
              GENERAL
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-3 py-3 rounded-xl text-gray-600 hover:bg-gray-50 hover:text-gray-800 transition-all duration-200"
            >
              <LogOut size={20} />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </nav>

        <div className="p-4">
          <div className="bg-gray-900 rounded-2xl p-4 text-white relative overflow-hidden shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-br from-empire-600 to-gold-600 opacity-90"></div>
            <div className="relative">
              <h3 className="font-semibold text-sm mb-1">Download our Mobile App</h3>
              <p className="text-xs text-empire-100 mb-3">Get easy access from your phone</p>
              <button className="bg-white text-empire-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-empire-50 transition-colors shadow-md">
                Download
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Mobile Sidebar */}
      <motion.div
        initial={{ x: -280 }}
        animate={{ x: isOpen ? 0 : -280 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="lg:hidden fixed left-0 top-0 h-screen w-70 bg-white border-r border-gray-200 flex flex-col z-50"
      >
        {/* Close button - Mobile only */}
        <button
          onClick={onClose}
          className="lg:hidden absolute top-4 right-4 p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
        >
          <X size={20} />
        </button>
      <div className="p-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-empire-600 to-gold-600 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-lg">B</span>
          </div>
          <span className="text-xl font-semibold text-gray-800">Blox</span>
        </div>
      </div>

      <nav className="flex-1 px-4">
        <div className="space-y-2">
          <div className="text-xs font-medium text-gray-400 uppercase tracking-wider px-3 mb-4">
            MENU
          </div>
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={`flex items-center space-x-3 px-3 py-3 rounded-xl transition-all duration-200 ${
                location.pathname === item.path
                  ? 'bg-empire-50 text-empire-700 border-l-4 border-empire-600 shadow-md'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
              }`}
            >
              <item.icon size={20} />
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </div>

        <div className="mt-8 space-y-2">
          <div className="text-xs font-medium text-gray-400 uppercase tracking-wider px-3 mb-4">
            GENERAL
          </div>
          <button
            onClick={() => {
              onClose()
              handleLogout()
            }}
            className="w-full flex items-center space-x-3 px-3 py-3 rounded-xl text-gray-600 hover:bg-gray-50 hover:text-gray-800 transition-all duration-200"
          >
            <LogOut size={20} />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </nav>

      <div className="p-4">
        <div className="bg-gray-900 rounded-2xl p-4 text-white relative overflow-hidden shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-br from-empire-600 to-gold-600 opacity-90"></div>
          <div className="relative">
            <h3 className="font-semibold text-sm mb-1">Download our Mobile App</h3>
            <p className="text-xs text-empire-100 mb-3">Get easy access from your phone</p>
            <button className="bg-white text-empire-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-empire-50 transition-colors shadow-md">
              Download
            </button>
          </div>
        </div>
      </div>
      </motion.div>
    </>
  )
}
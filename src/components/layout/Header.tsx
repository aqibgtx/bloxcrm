import { Search, Bell, Plus } from 'lucide-react'
import { motion } from 'framer-motion'

export default function Header() {
  return (
    <motion.header 
      initial={{ y: -60 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between"
    >
      <div className="flex items-center space-x-6">
      </div>

      <div className="flex items-center space-x-4">
          <button className="relative text-gray-600 hover:bg-gray-100 p-2 rounded-xl transition-colors">
            <Bell size={20} />
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              2
            </span>
          </button>

          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-red-400 rounded-full"></div>
            <div>
              <p className="text-sm font-medium text-gray-800">Qube @@</p>
              <p className="text-xs text-gray-500">aqibgtx@gmail.com</p>
            </div>
          </div>
      </div>
    </motion.header>
  )
}
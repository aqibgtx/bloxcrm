import { motion } from 'framer-motion'
import { User, Building, Palette, Shield, Download, Bell } from 'lucide-react'

export default function Settings() {
  return (
    <div className="p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-800">Settings</h1>
          <p className="text-gray-500">Manage your account and application preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <motion.div
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-2 space-y-8"
          >
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <div className="flex items-center space-x-3 mb-6">
                <User className="w-6 h-6 text-empire-600" />
                <h3 className="text-lg font-semibold text-gray-800">Personal Information</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-empire-500 focus:border-transparent shadow-sm"
                    defaultValue="Qube @@"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-empire-500 focus:border-transparent shadow-sm"
                    defaultValue="aqibgtx@gmail.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                  <input
                    type="tel"
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-empire-500 focus:border-transparent shadow-sm"
                    placeholder="+60 12-345 6789"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-empire-500 focus:border-transparent shadow-sm"
                    defaultValue="Project Manager"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <div className="flex items-center space-x-3 mb-6">
                <Building className="w-6 h-6 text-empire-600" />
                <h3 className="text-lg font-semibold text-gray-800">Company Branding</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-empire-500 focus:border-transparent shadow-sm"
                    defaultValue="Blox Solutions"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                  <input
                    type="url"
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-empire-500 focus:border-transparent shadow-sm"
                    placeholder="https://blox.com"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Company Address</label>
                  <textarea
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-empire-500 focus:border-transparent shadow-sm"
                    placeholder="Enter your company address"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <div className="flex items-center space-x-3 mb-6">
                <Bell className="w-6 h-6 text-empire-600" />
                <h3 className="text-lg font-semibold text-gray-800">Notifications</h3>
              </div>
              <div className="space-y-4">
                {[
                  { title: 'Project Updates', desc: 'Get notified when projects status changes' },
                  { title: 'Payment Reminders', desc: 'Reminders for pending payments and invoices' },
                  { title: 'Team Activities', desc: 'Updates on team member activities and completions' },
                  { title: 'Goal Milestones', desc: 'Notifications when you reach goal milestones' }
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
                    <div>
                      <h4 className="font-medium text-gray-800">{item.title}</h4>
                      <p className="text-sm text-gray-500">{item.desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-empire-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-empire-600"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="space-y-6"
          >
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <div className="flex items-center space-x-3 mb-6">
                <Palette className="w-6 h-6 text-empire-600" />
                <h3 className="text-lg font-semibold text-gray-800">Theme Settings</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Appearance</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button className="p-3 border-2 border-empire-500 rounded-xl bg-white text-center shadow-md">
                      <div className="w-full h-8 bg-gradient-to-r from-gray-100 to-white rounded mb-2"></div>
                      <span className="text-xs font-medium">Light</span>
                    </button>
                    <button className="p-3 border-2 border-gray-200 rounded-xl bg-white text-center hover:border-empire-500 transition-colors shadow-sm hover:shadow-md">
                      <div className="w-full h-8 bg-gradient-to-r from-gray-800 to-gray-600 rounded mb-2"></div>
                      <span className="text-xs font-medium">Dark</span>
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Primary Color</label>
                  <div className="flex space-x-2">
                    <button className="w-8 h-8 bg-empire-600 rounded-full border-2 border-empire-600 shadow-md"></button>
                    <button className="w-8 h-8 bg-blue-600 rounded-full border-2 border-gray-200 hover:border-blue-600 transition-colors shadow-sm hover:shadow-md"></button>
                    <button className="w-8 h-8 bg-purple-600 rounded-full border-2 border-gray-200 hover:border-purple-600 transition-colors"></button>
                    <button className="w-8 h-8 bg-orange-600 rounded-full border-2 border-gray-200 hover:border-orange-600 transition-colors"></button>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <div className="flex items-center space-x-3 mb-6">
                <Shield className="w-6 h-6 text-empire-600" />
                <h3 className="text-lg font-semibold text-gray-800">Security</h3>
              </div>
              <div className="space-y-4">
                <button className="w-full text-left p-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                  <span className="font-medium text-gray-800">Change Password</span>
                  <p className="text-sm text-gray-500">Update your account password</p>
                </button>
                <button className="w-full text-left p-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                  <span className="font-medium text-gray-800">Two-Factor Authentication</span>
                  <p className="text-sm text-gray-500">Add an extra layer of security</p>
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <div className="flex items-center space-x-3 mb-6">
                <Download className="w-6 h-6 text-empire-600" />
                <h3 className="text-lg font-semibold text-gray-800">Data Management</h3>
              </div>
              <div className="space-y-3">
                <button className="w-full bg-empire-600 text-white py-3 rounded-xl hover:bg-empire-700 transition-colors shadow-lg hover:shadow-xl">
                  Backup Data
                </button>
                <button className="w-full border border-gray-200 text-gray-700 py-3 rounded-xl hover:bg-gray-50 transition-colors">
                  Export Data
                </button>
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-8 flex justify-end space-x-4"
        >
          <button className="px-6 py-2 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button className="px-6 py-2 bg-empire-600 text-white rounded-xl hover:bg-empire-700 transition-colors shadow-lg hover:shadow-xl">
            Save Changes
          </button>
        </motion.div>
      </motion.div>
    </div>
  )
}
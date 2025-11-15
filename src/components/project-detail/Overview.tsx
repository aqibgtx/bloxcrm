import { motion } from 'framer-motion'
import { useState } from 'react'
import { Edit, User, Phone, Mail, MessageCircle, ExternalLink, Save } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import Modal from '../common/Modal'

interface OverviewProps {
  project: {
    id: string
    name: string | null
    quick_description: string | null
    whatsapp_group_name: string | null
    case_study_link: string | null
    client_id: string | null
    clients?: {
      id?: string
      name: string | null
      email: string | null
      phone: string | null
    }
  }
  onUpdate: () => void
}

export default function Overview({ project, onUpdate }: OverviewProps) {
  const [showEditModal, setShowEditModal] = useState(false)
  const [showClientModal, setShowClientModal] = useState(false)
  const [localProject, setLocalProject] = useState(project)
  const [editData, setEditData] = useState({
    quick_description: project.quick_description || '',
    whatsapp_group_name: project.whatsapp_group_name || '',
    case_study_link: project.case_study_link || ''
  })
  const [clientData, setClientData] = useState({
    name: project.clients?.name || '',
    email: project.clients?.email || '',
    phone: project.clients?.phone || ''
  })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    try {
      setSaving(true)
      const { error } = await supabase
        .from('projects')
        .update(editData)
        .eq('id', project.id)

      if (error) throw error

      setLocalProject({ ...localProject, ...editData })
      setShowEditModal(false)
    } catch (error) {
      console.error('Error updating project:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleSaveClient = async () => {
    try {
      setSaving(true)

      if (project.client_id) {
        // Update existing client
        const { error } = await supabase
          .from('clients')
          .update({
            name: clientData.name,
            email: clientData.email,
            phone: clientData.phone
          })
          .eq('id', project.client_id)

        if (error) throw error

        setLocalProject({
          ...localProject,
          clients: {
            ...localProject.clients,
            name: clientData.name,
            email: clientData.email,
            phone: clientData.phone
          }
        })
      }

      setShowClientModal(false)
    } catch (error) {
      console.error('Error updating client:', error)
    } finally {
      setSaving(false)
    }
  }
  return (
    <div className="space-y-8">
      {/* Project Description */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-2xl p-6 shadow-lg"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-800">Project Context</h3>
          <button
            onClick={() => setShowEditModal(true)}
            className="flex items-center space-x-2 text-empire-600 hover:bg-empire-50 px-3 py-2 rounded-lg transition-colors"
          >
            <Edit size={16} />
            <span>Edit</span>
          </button>
        </div>
        
        <div className="prose max-w-none">
          <p className="text-gray-700 leading-relaxed">
            {localProject.quick_description || 'No project description available. Click edit to add context for this project.'}
          </p>
        </div>
      </motion.div>

      {/* Client Information */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="bg-white rounded-2xl p-6 shadow-lg"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-800">Client Information</h3>
          {localProject.client_id && (
            <button
              onClick={() => setShowClientModal(true)}
              className="flex items-center space-x-2 text-empire-600 hover:bg-empire-50 px-3 py-2 rounded-lg transition-colors"
            >
              <Edit size={16} />
              <span>Edit</span>
            </button>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <User className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Client Name</p>
              <p className="font-medium text-gray-800">{localProject.clients?.name || 'Not specified'}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <Phone className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Phone Number</p>
              <p className="font-medium text-gray-800">{localProject.clients?.phone || 'Not specified'}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Mail className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium text-gray-800">{localProject.clients?.email || 'Not specified'}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* WhatsApp Group & Case Study */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white rounded-2xl p-6 shadow-lg"
        >
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-800">WhatsApp Group</h4>
              <p className="text-sm text-gray-500">Project communication channel</p>
            </div>
          </div>
          <p className="text-gray-700 font-medium">
            {localProject.whatsapp_group_name || 'No WhatsApp group specified'}
          </p>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-white rounded-2xl p-6 shadow-lg"
        >
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-empire-100 rounded-xl flex items-center justify-center">
              <ExternalLink className="w-6 h-6 text-empire-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-800">Case Study</h4>
              <p className="text-sm text-gray-500">Project showcase link</p>
            </div>
          </div>
          {localProject.case_study_link ? (
            <a
              href={localProject.case_study_link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-empire-600 hover:text-empire-700 font-medium underline"
            >
              View Case Study
            </a>
          ) : (
            <p className="text-gray-500">No case study link available</p>
          )}
        </motion.div>
      </div>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Project Overview"
      >
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Project Description
            </label>
            <textarea
              rows={4}
              value={editData.quick_description}
              onChange={(e) => setEditData({ ...editData, quick_description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-empire-500 focus:border-transparent"
              placeholder="Add context and description for this project..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              WhatsApp Group Name
            </label>
            <input
              type="text"
              value={editData.whatsapp_group_name}
              onChange={(e) => setEditData({ ...editData, whatsapp_group_name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-empire-500 focus:border-transparent"
              placeholder="Enter WhatsApp group name..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Case Study Link
            </label>
            <input
              type="url"
              value={editData.case_study_link}
              onChange={(e) => setEditData({ ...editData, case_study_link: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-empire-500 focus:border-transparent"
              placeholder="https://example.com/case-study"
            />
          </div>

          <div className="flex justify-end space-x-4">
            <button
              onClick={() => setShowEditModal(false)}
              className="px-6 py-2 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 bg-empire-600 text-white rounded-xl hover:bg-empire-700 transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Client Edit Modal */}
      <Modal
        isOpen={showClientModal}
        onClose={() => setShowClientModal(false)}
        title="Edit Client Information"
      >
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Client Name
            </label>
            <input
              type="text"
              value={clientData.name}
              onChange={(e) => setClientData({ ...clientData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-empire-500 focus:border-transparent"
              placeholder="Enter client name..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={clientData.email}
              onChange={(e) => setClientData({ ...clientData, email: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-empire-500 focus:border-transparent"
              placeholder="client@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              value={clientData.phone}
              onChange={(e) => setClientData({ ...clientData, phone: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-empire-500 focus:border-transparent"
              placeholder="+60 12-345 6789"
            />
          </div>

          <div className="flex justify-end space-x-4">
            <button
              onClick={() => setShowClientModal(false)}
              className="px-6 py-2 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveClient}
              disabled={saving}
              className="px-6 py-2 bg-empire-600 text-white rounded-xl hover:bg-empire-700 transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Client'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
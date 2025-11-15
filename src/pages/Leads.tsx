import { motion } from 'framer-motion'
import { Plus, User, Phone, Mail, Building, Edit, Filter, Trash2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import Modal from '../components/common/Modal'
import { formatDate } from '../utils/dateFormat'

interface Client {
  id: string
  name: string | null
  company: string | null
  email: string | null
  phone: string | null
  notes: string | null
  status: string
  created_at: string
  projects?: Array<{
    id: string
    name: string | null
  }>
}

export default function Leads() {
  const [clients, setClients] = useState<Client[]>([])
  const [filteredClients, setFilteredClients] = useState<Client[]>([])
  const [activeFilter, setActiveFilter] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [clientData, setClientData] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    notes: '',
    status: 'interested'
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const statusOptions = [
    { value: 'interested', label: 'Interested', color: 'bg-blue-100 text-blue-700' },
    { value: 'converted', label: 'Converted', color: 'bg-purple-100 text-purple-700' },
    { value: 'client', label: 'Client', color: 'bg-green-100 text-green-700' }
  ]

  useEffect(() => {
    fetchClients()
  }, [])

  useEffect(() => {
    filterClients()
  }, [clients, activeFilter, searchQuery])

  const fetchClients = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('clients')
        .select(`
          *,
          projects (
            id,
            name
          )
        `)
        .order('created_at', { ascending: false })
      
      if (error) throw error

      setClients(data || [])
    } catch (error) {
      console.error('Error fetching clients:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterClients = () => {
    let filtered = clients

    if (activeFilter !== 'all') {
      filtered = filtered.filter(client => client.status === activeFilter)
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(client =>
        client.name?.toLowerCase().includes(query) ||
        client.company?.toLowerCase().includes(query) ||
        client.email?.toLowerCase().includes(query)
      )
    }

    setFilteredClients(filtered)
  }

  const handleSaveClient = async () => {
    try {
      setSaving(true)
      
      if (editingClient) {
        // Update existing client
        const { error } = await supabase
          .from('clients')
          .update({
            name: clientData.name,
            company: clientData.company,
            email: clientData.email,
            phone: clientData.phone,
            notes: clientData.notes,
            status: clientData.status
          })
          .eq('id', editingClient.id)
        
        if (error) throw error
      } else {
        // Create new client
        const { error } = await supabase
          .from('clients')
          .insert({
            name: clientData.name,
            company: clientData.company,
            email: clientData.email,
            phone: clientData.phone,
            notes: clientData.notes,
            status: clientData.status
          })
        
        if (error) throw error
      }
      
      setShowModal(false)
      setEditingClient(null)
      setClientData({
        name: '',
        company: '',
        email: '',
        phone: '',
        notes: '',
        status: 'interested'
      })
      fetchClients()
    } catch (error) {
      console.error('Error saving client:', error)
    } finally {
      setSaving(false)
    }
  }

  const openEditClient = (client: Client) => {
    setEditingClient(client)
    setClientData({
      name: client.name || '',
      company: client.company || '',
      email: client.email || '',
      phone: client.phone || '',
      notes: client.notes || '',
      status: client.status || 'interested'
    })
    setShowModal(true)
  }

  const openNewClient = () => {
    setEditingClient(null)
    setClientData({
      name: '',
      company: '',
      email: '',
      phone: '',
      notes: '',
      status: 'interested'
    })
    setShowModal(true)
  }

  const handleDeleteClient = async (clientId: string) => {
    if (!confirm('Are you sure you want to delete this lead?')) return

    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientId)

      if (error) throw error
      fetchClients()
    } catch (error) {
      console.error('Error deleting client:', error)
    }
  }

  const getStatusConfig = (status: string) => {
    return statusOptions.find(option => option.value === status) || statusOptions[0]
  }

  const getStatusCounts = () => {
    return {
      all: clients.length,
      client: clients.filter(c => c.status === 'client').length,
      interested: clients.filter(c => c.status === 'interested').length,
      converted: clients.filter(c => c.status === 'converted').length
    }
  }

  const statusCounts = getStatusCounts()

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-empire-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">Leads</h1>
            <p className="text-gray-500">Manage your client pipeline and track lead status</p>
          </div>
          <button
            onClick={openNewClient}
            className="bg-empire-600 text-white px-4 py-2 rounded-xl hover:bg-empire-700 transition-colors flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl w-full sm:w-auto"
          >
            <Plus size={16} />
            <span>Add Lead</span>
          </button>
        </div>

        {/* Status Filter Tabs */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="bg-white rounded-2xl p-2 shadow-lg mb-8"
        >
          <div className="grid grid-cols-2 sm:flex sm:space-x-2 gap-2 sm:gap-0">
            <button
              onClick={() => setActiveFilter('all')}
              className={`sm:flex-1 px-4 sm:px-6 py-3 rounded-xl font-medium transition-all duration-200 whitespace-nowrap ${
                activeFilter === 'all'
                  ? 'bg-empire-600 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              All ({statusCounts.all})
            </button>
            <button
              onClick={() => setActiveFilter('client')}
              className={`sm:flex-1 px-4 sm:px-6 py-3 rounded-xl font-medium transition-all duration-200 whitespace-nowrap ${
                activeFilter === 'client'
                  ? 'bg-empire-600 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Client ({statusCounts.client})
            </button>
            <button
              onClick={() => setActiveFilter('interested')}
              className={`sm:flex-1 px-4 sm:px-6 py-3 rounded-xl font-medium transition-all duration-200 whitespace-nowrap ${
                activeFilter === 'interested'
                  ? 'bg-empire-600 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Interested ({statusCounts.interested})
            </button>
            <button
              onClick={() => setActiveFilter('converted')}
              className={`sm:flex-1 px-4 sm:px-6 py-3 rounded-xl font-medium transition-all duration-200 whitespace-nowrap ${
                activeFilter === 'converted'
                  ? 'bg-empire-600 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Converted ({statusCounts.converted})
            </button>
          </div>
        </motion.div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by name, company, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-empire-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Clients Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.length > 0 ? filteredClients.map((client, index) => (
            <motion.div
              key={client.id}
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-empire-500 to-gold-500 rounded-xl flex items-center justify-center shadow-lg">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">{client.name || 'Unnamed Client'}</h3>
                    {client.company && (
                      <p className="text-sm text-gray-500">{client.company}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => openEditClient(client)}
                    className="text-gray-400 hover:text-empire-600 p-1.5 rounded transition-colors"
                  >
                    <Edit size={20} />
                  </button>
                  <button
                    onClick={() => handleDeleteClient(client.id)}
                    className="text-gray-400 hover:text-red-600 p-1.5 rounded transition-colors"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                {client.email && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Mail size={14} />
                    <span>{client.email}</span>
                  </div>
                )}
                {client.phone && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Phone size={14} />
                    <span>{client.phone}</span>
                  </div>
                )}
                {client.projects && client.projects.length > 0 && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Building size={14} />
                    <span>{client.projects.length} project{client.projects.length !== 1 ? 's' : ''}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusConfig(client.status).color}`}>
                  {getStatusConfig(client.status).label}
                </span>
                <span className="text-xs text-gray-500">
                  Added {formatDate(client.created_at)}
                </span>
              </div>

              {client.notes && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-sm text-gray-600 line-clamp-2">{client.notes}</p>
                </div>
              )}
            </motion.div>
          )) : (
            <div className="col-span-full text-center py-12">
              <User className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-800 mb-2">
                {activeFilter === 'all' ? 'No leads found' : `No ${getStatusConfig(activeFilter).label.toLowerCase()} leads`}
              </h3>
              <p className="text-gray-500 mb-6">
                {activeFilter === 'all' 
                  ? 'Start by adding your first lead to track your client pipeline'
                  : `No leads with ${getStatusConfig(activeFilter).label.toLowerCase()} status found`
                }
              </p>
              <button
                onClick={openNewClient}
                className="bg-empire-600 text-white px-6 py-3 rounded-xl hover:bg-empire-700 transition-colors shadow-lg"
              >
                Add Your First Lead
              </button>
            </div>
          )}
        </div>

        {/* Client Modal */}
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={editingClient ? 'Edit Lead' : 'Add New Lead'}
        >
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={clientData.name}
                  onChange={(e) => setClientData({ ...clientData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-empire-500 focus:border-transparent"
                  placeholder="Enter full name..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company
                </label>
                <input
                  type="text"
                  value={clientData.company}
                  onChange={(e) => setClientData({ ...clientData, company: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-empire-500 focus:border-transparent"
                  placeholder="Company name..."
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={clientData.email}
                  onChange={(e) => setClientData({ ...clientData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-empire-500 focus:border-transparent"
                  placeholder="email@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  value={clientData.phone}
                  onChange={(e) => setClientData({ ...clientData, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-empire-500 focus:border-transparent"
                  placeholder="+60 12-345 6789"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                rows={3}
                value={clientData.notes}
                onChange={(e) => setClientData({ ...clientData, notes: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-empire-500 focus:border-transparent"
                placeholder="Add notes about this lead..."
              />
            </div>

            {/* Only show status selector if client has no projects */}
            {(!editingClient || (editingClient.projects && editingClient.projects.length === 0)) && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={clientData.status}
                  onChange={(e) => setClientData({ ...clientData, status: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-empire-500 focus:border-transparent"
                >
                  <option value="interested">Interested</option>
                  <option value="converted">Converted</option>
                </select>
              </div>
            )}

            {/* Show client status badge if they have projects */}
            {editingClient && editingClient.projects && editingClient.projects.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <div className="px-4 py-2 bg-green-50 border border-green-200 rounded-xl">
                  <span className="text-green-700 font-medium">Client</span>
                  <span className="text-gray-500 text-sm ml-2">(Assigned to {editingClient.projects.length} project{editingClient.projects.length > 1 ? 's' : ''})</span>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-2 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveClient}
                disabled={saving || !clientData.name.trim()}
                className="px-6 py-2 bg-empire-600 text-white rounded-xl hover:bg-empire-700 transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : editingClient ? 'Update Lead' : 'Add Lead'}
              </button>
            </div>
          </div>
        </Modal>
      </motion.div>
    </div>
  )
}
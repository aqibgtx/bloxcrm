import { motion } from 'framer-motion'
import { Plus, ExternalLink, Edit, Trash2, Search, ChevronDown } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { Link } from 'react-router-dom'
import Modal from '../components/common/Modal'
import { formatDate } from '../utils/dateFormat'

interface Project {
  id: string
  name: string | null
  status: string | null
  progress: number
  client_id: string | null
  due_date: string | null
  created_at: string
  description: string | null
  clients?: {
    name: string | null
    company: string | null
  }
  total_cost: number
  total_revenue: number
  target_revenue: number
}

interface Client {
  id: string
  name: string | null
  company: string | null
}

const statusColors = {
  Active: 'bg-green-100 text-green-700',
  Inactive: 'bg-gray-100 text-gray-700',
  Closed: 'bg-blue-100 text-blue-700',
  'Bug Fix': 'bg-red-100 text-red-700',
  Upgrade: 'bg-purple-100 text-purple-700',
  Pending: 'bg-yellow-100 text-yellow-700'
}

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [showModal, setShowModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showClientModal, setShowClientModal] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [selectedMonth, setSelectedMonth] = useState('all')
  const [selectedYear, setSelectedYear] = useState('all')
  const [projectData, setProjectData] = useState({
    name: '',
    client_id: '',
    description: '',
    status: 'Pending',
    due_date: '',
    target_revenue: ''
  })
  const [clientData, setClientData] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    notes: '',
    status: 'interested'
  })
  const [clientSearch, setClientSearch] = useState('')
  const [showClientDropdown, setShowClientDropdown] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  const months = [
    { value: 'all', label: 'All Months' },
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' }
  ]

  const currentYear = new Date().getFullYear()
  const years = [
    { value: 'all', label: 'All Years' },
    ...Array.from({ length: 5 }, (_, i) => ({
      value: (currentYear - i).toString(),
      label: (currentYear - i).toString()
    }))
  ]

  useEffect(() => {
    fetchProjects()
    fetchClients()
  }, [])

  useEffect(() => {
    filterProjects()
  }, [projects, selectedMonth, selectedYear, searchQuery])

  const fetchProjects = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          clients (
            name,
            company
          ),
          project_costs (
            amount
          ),
          invoices (
            amount
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Calculate financial data from nested relations
      const projectsWithFinancials = (data || []).map((project) => {
        const total_cost = project.project_costs?.reduce((sum, cost) => sum + (cost.amount || 0), 0) || 0
        const total_revenue = project.invoices?.reduce((sum, invoice) => sum + (invoice.amount || 0), 0) || 0

        return {
          ...project,
          total_cost,
          total_revenue
        }
      })

      setProjects(projectsWithFinancials)
    } catch (error) {
      console.error('Error fetching projects:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchClients = async () => {
    try {
      const { data } = await supabase.from('clients').select('id, name, company')
      if (data) {
        setClients(data)
      }
    } catch (error) {
      console.error('Error fetching clients:', error)
    }
  }

  const handleSaveClient = async () => {
    try {
      setSaving(true)
      const { data, error } = await supabase
        .from('clients')
        .insert({
          name: clientData.name,
          company: clientData.company,
          email: clientData.email,
          phone: clientData.phone,
          notes: clientData.notes,
          status: clientData.status
        })
        .select()

      if (error) throw error

      setShowClientModal(false)
      setClientData({
        name: '',
        company: '',
        email: '',
        phone: '',
        notes: '',
        status: 'interested'
      })
      await fetchClients()

      if (data && data.length > 0) {
        setProjectData({ ...projectData, client_id: data[0].id })
      }
    } catch (error) {
      console.error('Error saving client:', error)
    } finally {
      setSaving(false)
    }
  }

  const filterProjects = () => {
    let filtered = [...projects]

    if (selectedMonth !== 'all') {
      filtered = filtered.filter(project => {
        const projectMonth = new Date(project.created_at).getMonth() + 1
        return projectMonth.toString() === selectedMonth
      })
    }

    if (selectedYear !== 'all') {
      filtered = filtered.filter(project => {
        const projectYear = new Date(project.created_at).getFullYear()
        return projectYear.toString() === selectedYear
      })
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(project =>
        project.name?.toLowerCase().includes(query) ||
        project.clients?.name?.toLowerCase().includes(query) ||
        project.clients?.company?.toLowerCase().includes(query)
      )
    }

    setFilteredProjects(filtered)
  }

  const handleSaveProject = async () => {
    try {
      setSaving(true)

      const processedData = {
        ...projectData,
        client_id: projectData.client_id === '' ? null : projectData.client_id,
        due_date: projectData.due_date === '' ? null : projectData.due_date,
        target_revenue: projectData.target_revenue === '' ? 0 : parseFloat(projectData.target_revenue)
      }

      const { error } = await supabase
        .from('projects')
        .insert(processedData)

      if (error) throw error

      setShowModal(false)
      setProjectData({
        name: '',
        client_id: '',
        description: '',
        status: 'Pending',
        due_date: '',
        target_revenue: ''
      })
      fetchProjects()
    } catch (error) {
      console.error('Error saving project:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleEditProject = async () => {
    if (!editingProject) return

    try {
      setSaving(true)

      const processedData = {
        ...projectData,
        client_id: projectData.client_id === '' ? null : projectData.client_id,
        due_date: projectData.due_date === '' ? null : projectData.due_date,
        target_revenue: projectData.target_revenue === '' ? 0 : parseFloat(projectData.target_revenue)
      }

      const { error } = await supabase
        .from('projects')
        .update(processedData)
        .eq('id', editingProject.id)

      if (error) throw error

      setShowEditModal(false)
      setEditingProject(null)
      setProjectData({
        name: '',
        client_id: '',
        description: '',
        status: 'Pending',
        due_date: '',
        target_revenue: ''
      })
      fetchProjects()
    } catch (error) {
      console.error('Error updating project:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId)

      if (error) throw error
      
      fetchProjects()
    } catch (error) {
      console.error('Error deleting project:', error)
    }
  }

  const openEditModal = (project: Project) => {
    setEditingProject(project)
    setProjectData({
      name: project.name || '',
      client_id: project.client_id || '',
      description: project.description || '',
      status: project.status || 'Pending',
      due_date: project.due_date || '',
      target_revenue: project.target_revenue ? project.target_revenue.toString() : ''
    })
    setShowEditModal(true)
  }

  const formatCurrency = (amount: number) => {
    return `RM ${amount.toLocaleString()}`
  }

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
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <h1 className="text-2xl font-semibold text-gray-800">Projects</h1>
              <p className="text-gray-500">Manage and track your project progress</p>
            </div>
            <button
              onClick={() => {
                setProjectData({
                  name: '',
                  client_id: '',
                  description: '',
                  status: 'Pending',
                  due_date: '',
                  target_revenue: ''
                })
                setShowModal(true)
              }}
              className="bg-empire-600 text-white px-4 py-2 rounded-xl hover:bg-empire-700 transition-colors flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl w-full sm:w-auto"
            >
              <Plus size={16} />
              <span>Add Project</span>
            </button>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full sm:w-auto px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-empire-500 focus:border-transparent"
            >
              {months.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full sm:w-auto px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-empire-500 focus:border-transparent"
            >
              {years.map((year) => (
                <option key={year.value} value={year.value}>
                  {year.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search projects by name or client..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-empire-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800 text-lg mb-2">{project.name}</h3>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-800 font-semibold">
                      {project.clients?.name || 'No client assigned'}
                    </p>
                    <p className="text-sm text-gray-800 font-semibold">
                      {formatDate(project.created_at)}
                    </p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  statusColors[project.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-700'
                }`}>
                  {project.status}
                </span>
              </div>

              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-500">Progress</span>
                  <span className="text-sm font-medium text-gray-800">{project.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <motion.div 
                    className="bg-empire-500 h-2 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${project.progress}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  ></motion.div>
                </div>
              </div>

              {/* Financial Information */}
              <div className="mb-4 p-3 bg-gray-50 rounded-xl">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Target Revenue</p>
                    <p className="font-semibold text-blue-600">{formatCurrency(project.target_revenue)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Cost</p>
                    <p className="font-semibold text-red-600">{formatCurrency(project.total_cost)}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between space-x-2">
                <Link
                  to={`/projects/${project.id}`}
                  className="bg-empire-50 text-empire-700 px-4 py-2 rounded-lg hover:bg-empire-100 transition-colors flex items-center space-x-2 shadow-sm hover:shadow-md"
                >
                  <ExternalLink size={16} />
                  <span>Enter Project</span>
                </Link>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => openEditModal(project)}
                    className="text-gray-600 hover:text-empire-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDeleteProject(project.id)}
                    className="text-gray-600 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {filteredProjects.length === 0 && (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-800 mb-2">No projects found</h3>
            <p className="text-gray-500 mb-6">
              {selectedMonth !== 'all' || selectedYear !== 'all' 
                ? 'No projects match the selected filters'
                : 'Start by adding your first project'
              }
            </p>
            <button
              onClick={() => {
                setProjectData({
                  name: '',
                  client_id: '',
                  description: '',
                  status: 'Pending',
                  due_date: '',
                  target_revenue: ''
                })
                setShowModal(true)
              }}
              className="bg-empire-600 text-white px-6 py-3 rounded-xl hover:bg-empire-700 transition-colors shadow-lg"
            >
              Add Your First Project
            </button>
          </div>
        )}

        {/* Add Project Modal */}
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title="Add New Project"
        >
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Name *
              </label>
              <input
                type="text"
                value={projectData.name}
                onChange={(e) => setProjectData({ ...projectData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-empire-500 focus:border-transparent"
                placeholder="Enter project name..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Client
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowClientDropdown(!showClientDropdown)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-empire-500 focus:border-transparent flex items-center justify-between text-left"
                >
                  <span className={projectData.client_id ? 'text-gray-800' : 'text-gray-400'}>
                    {projectData.client_id
                      ? clients.find(c => c.id === projectData.client_id)?.name +
                        (clients.find(c => c.id === projectData.client_id)?.company
                          ? ` (${clients.find(c => c.id === projectData.client_id)?.company})`
                          : '')
                      : 'Select a client...'}
                  </span>
                  <ChevronDown size={20} className="text-gray-400" />
                </button>
                {showClientDropdown && (
                  <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg max-h-80 overflow-hidden">
                    <div className="p-3 border-b border-gray-200">
                      <div className="relative">
                        <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          value={clientSearch}
                          onChange={(e) => setClientSearch(e.target.value)}
                          placeholder="Search clients..."
                          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-empire-500"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setShowClientModal(true)
                        setShowClientDropdown(false)
                      }}
                      className="w-full px-4 py-3 text-left text-empire-600 hover:bg-gray-50 border-b border-gray-200 font-medium flex items-center"
                    >
                      <Plus size={18} className="mr-2" />
                      Add New Client
                    </button>
                    <div className="max-h-60 overflow-y-auto">
                      {clients
                        .filter(client =>
                          client.name?.toLowerCase().includes(clientSearch.toLowerCase()) ||
                          client.company?.toLowerCase().includes(clientSearch.toLowerCase())
                        )
                        .map((client) => (
                          <button
                            key={client.id}
                            type="button"
                            onClick={() => {
                              setProjectData({ ...projectData, client_id: client.id })
                              setShowClientDropdown(false)
                              setClientSearch('')
                            }}
                            className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100"
                          >
                            <div className="font-medium text-gray-800">{client.name}</div>
                            {client.company && (
                              <div className="text-sm text-gray-500">{client.company}</div>
                            )}
                          </button>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                rows={3}
                value={projectData.description}
                onChange={(e) => setProjectData({ ...projectData, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-empire-500 focus:border-transparent"
                placeholder="Enter project description..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={projectData.status}
                onChange={(e) => setProjectData({ ...projectData, status: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-empire-500 focus:border-transparent"
              >
                <option value="Pending">Pending</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Closed">Closed</option>
                <option value="Bug Fix">Bug Fix</option>
                <option value="Upgrade">Upgrade</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Due Date
              </label>
              <input
                type="date"
                value={projectData.due_date}
                onChange={(e) => setProjectData({ ...projectData, due_date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-empire-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Revenue (RM)
              </label>
              <input
                type="number"
                step="0.01"
                value={projectData.target_revenue}
                onChange={(e) => setProjectData({ ...projectData, target_revenue: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-empire-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>

            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-2 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProject}
                disabled={saving || !projectData.name.trim()}
                className="px-6 py-2 bg-empire-600 text-white rounded-xl hover:bg-empire-700 transition-colors disabled:opacity-50"
              >
                {saving ? 'Creating...' : 'Create Project'}
              </button>
            </div>
          </div>
        </Modal>

        {/* Edit Project Modal */}
        <Modal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          title="Edit Project"
        >
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Name *
              </label>
              <input
                type="text"
                value={projectData.name}
                onChange={(e) => setProjectData({ ...projectData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-empire-500 focus:border-transparent"
                placeholder="Enter project name..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Client
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowClientDropdown(!showClientDropdown)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-empire-500 focus:border-transparent flex items-center justify-between text-left"
                >
                  <span className={projectData.client_id ? 'text-gray-800' : 'text-gray-400'}>
                    {projectData.client_id
                      ? clients.find(c => c.id === projectData.client_id)?.name +
                        (clients.find(c => c.id === projectData.client_id)?.company
                          ? ` (${clients.find(c => c.id === projectData.client_id)?.company})`
                          : '')
                      : 'Select a client...'}
                  </span>
                  <ChevronDown size={20} className="text-gray-400" />
                </button>
                {showClientDropdown && (
                  <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg max-h-80 overflow-hidden">
                    <div className="p-3 border-b border-gray-200">
                      <div className="relative">
                        <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          value={clientSearch}
                          onChange={(e) => setClientSearch(e.target.value)}
                          placeholder="Search clients..."
                          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-empire-500"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setShowClientModal(true)
                        setShowClientDropdown(false)
                      }}
                      className="w-full px-4 py-3 text-left text-empire-600 hover:bg-gray-50 border-b border-gray-200 font-medium flex items-center"
                    >
                      <Plus size={18} className="mr-2" />
                      Add New Client
                    </button>
                    <div className="max-h-60 overflow-y-auto">
                      {clients
                        .filter(client =>
                          client.name?.toLowerCase().includes(clientSearch.toLowerCase()) ||
                          client.company?.toLowerCase().includes(clientSearch.toLowerCase())
                        )
                        .map((client) => (
                          <button
                            key={client.id}
                            type="button"
                            onClick={() => {
                              setProjectData({ ...projectData, client_id: client.id })
                              setShowClientDropdown(false)
                              setClientSearch('')
                            }}
                            className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100"
                          >
                            <div className="font-medium text-gray-800">{client.name}</div>
                            {client.company && (
                              <div className="text-sm text-gray-500">{client.company}</div>
                            )}
                          </button>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                rows={3}
                value={projectData.description}
                onChange={(e) => setProjectData({ ...projectData, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-empire-500 focus:border-transparent"
                placeholder="Enter project description..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={projectData.status}
                onChange={(e) => setProjectData({ ...projectData, status: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-empire-500 focus:border-transparent"
              >
                <option value="Pending">Pending</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Closed">Closed</option>
                <option value="Bug Fix">Bug Fix</option>
                <option value="Upgrade">Upgrade</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Due Date
              </label>
              <input
                type="date"
                value={projectData.due_date}
                onChange={(e) => setProjectData({ ...projectData, due_date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-empire-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Revenue (RM)
              </label>
              <input
                type="number"
                step="0.01"
                value={projectData.target_revenue}
                onChange={(e) => setProjectData({ ...projectData, target_revenue: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-empire-500 focus:border-transparent"
                placeholder="0.00"
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
                onClick={handleEditProject}
                disabled={saving || !projectData.name.trim()}
                className="px-6 py-2 bg-empire-600 text-white rounded-xl hover:bg-empire-700 transition-colors disabled:opacity-50"
              >
                {saving ? 'Updating...' : 'Update Project'}
              </button>
            </div>
          </div>
        </Modal>

        {/* Create Client Modal */}
        <Modal
          isOpen={showClientModal}
          onClose={() => setShowClientModal(false)}
          title="Create New Client"
        >
          <div className="space-y-4">
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
                placeholder="Add notes about this client..."
              />
            </div>

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

            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowClientModal(false)}
                className="px-6 py-2 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveClient}
                disabled={saving || !clientData.name.trim()}
                className="px-6 py-2 bg-empire-600 text-white rounded-xl hover:bg-empire-700 transition-colors disabled:opacity-50"
              >
                {saving ? 'Creating...' : 'Create Client'}
              </button>
            </div>
          </div>
        </Modal>
      </motion.div>
    </div>
  )
}
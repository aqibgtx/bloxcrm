import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, DollarSign, TrendingUp, Calendar } from 'lucide-react'
import { supabase } from '../lib/supabase'
import Overview from '../components/project-detail/Overview'
import Chapter from '../components/project-detail/Chapter'
import Payments from '../components/project-detail/Payments'
import { formatDate } from '../utils/dateFormat'

interface ProjectData {
  id: string
  name: string | null
  client_id: string | null
  description: string | null
  status: string | null
  progress: number
  due_date: string | null
  quick_description: string | null
  whatsapp_group_name: string | null
  initial_project_scope: string | null
  case_study_link: string | null
  target_revenue: number
  clients?: {
    name: string | null
    email: string | null
    phone: string | null
  }
}

interface ProjectStats {
  totalRevenue: number
  totalCost: number
  netProfit: number
}

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [project, setProject] = useState<ProjectData | null>(null)
  const [stats, setStats] = useState<ProjectStats>({ totalRevenue: 0, totalCost: 0, netProfit: 0 })
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      fetchProjectData()
    }
  }, [id])

  const fetchProjectData = async () => {
    try {
      setLoading(true)
      
      // Fetch project with client data
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select(`
          *,
          clients (
            name,
            email,
            phone
          )
        `)
        .eq('id', id)
        .single()

      if (projectError) throw projectError
      setProject(projectData)

      // Fetch financial stats
      const [revenueResponse, costResponse] = await Promise.all([
        supabase.from('invoices').select('amount').eq('project_id', id),
        supabase.from('project_costs').select('amount').eq('project_id', id)
      ])

      const totalRevenue = revenueResponse.data?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0
      const totalCost = costResponse.data?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0
      const netProfit = (projectData.target_revenue || 0) - totalCost

      setStats({ totalRevenue, totalCost, netProfit })
    } catch (error) {
      console.error('Error fetching project data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700'
      case 'developing':
        return 'bg-blue-100 text-blue-700'
      case 'confirmed':
        return 'bg-purple-100 text-purple-700'
      case 'bug fix':
        return 'bg-red-100 text-red-700'
      case 'upgrade':
        return 'bg-orange-100 text-orange-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const formatCurrency = (amount: number) => {
    return `RM ${amount.toLocaleString()}`
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'chapter', label: 'Chapter' },
    { id: 'payments', label: 'Payments' }
  ]

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-empire-600"></div>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="p-8">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-gray-800 mb-4">Project Not Found</h1>
          <button
            onClick={() => navigate('/projects')}
            className="bg-empire-600 text-white px-4 py-2 rounded-xl hover:bg-empire-700 transition-colors"
          >
            Back to Projects
          </button>
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
        {/* Header */}
        <div className="flex items-center space-x-4 mb-8">
          <button
            onClick={() => navigate('/projects')}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">{project.name}</h1>
            <p className="text-gray-500">{project.clients?.name || 'No Client'}</p>
          </div>
        </div>

        {/* Financial Overview */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8"
        >
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <p className="text-sm text-gray-500 mb-1">Revenue</p>
            <p className="text-2xl font-semibold text-gray-800">{formatCurrency(project.target_revenue || 0)}</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <p className="text-sm text-gray-500 mb-1">Pending Payment</p>
            <p className="text-2xl font-semibold text-orange-600">{formatCurrency((project.target_revenue || 0) - stats.totalRevenue)}</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <p className="text-sm text-gray-500 mb-1">Cost</p>
            <p className="text-2xl font-semibold text-red-600">{formatCurrency(stats.totalCost)}</p>
          </div>
        </motion.div>

        {/* Tab Navigation */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white rounded-2xl p-2 shadow-lg mb-8"
        >
          <div className="flex space-x-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 px-4 sm:px-6 py-3 rounded-xl font-medium transition-all duration-200 text-sm sm:text-base ${
                  activeTab === tab.id
                    ? 'bg-empire-600 text-white shadow-lg'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
        >
          {activeTab === 'overview' && <Overview project={project} onUpdate={fetchProjectData} />}
          {activeTab === 'chapter' && <Chapter projectId={project.id} onUpdate={fetchProjectData} />}
          {activeTab === 'payments' && <Payments projectId={project.id} onUpdate={fetchProjectData} />}
        </motion.div>
      </motion.div>
    </div>
  )
}